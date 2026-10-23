"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Wrapped } from "@/lib/api";

// How long each slide stays up before moving on by itself.
const SLIDE_MS = 4500;

type Slide = {
  key: string;
  emoji: string;
  label: string;
  value?: number; // numbers count up when the slide appears
  text?: string; // or a word/phrase instead of a number
  detail?: string;
  color: "purple" | "pink";
};

// Turn the year's recap into a list of slides, skipping ones with nothing to show.
export function buildSlides(wrapped: Wrapped): Slide[] {
  const slides: Slide[] = [
    { key: "intro", emoji: "🎁", label: `Your ${wrapped.year}`, text: "in travel", detail: "Tap or press → to keep going", color: "purple" },
    { key: "trips", emoji: "🧳", label: "Trips taken", value: wrapped.trips_taken, color: "pink" },
    { key: "days", emoji: "📅", label: "Days traveled", value: wrapped.days_traveled, color: "purple" },
    {
      key: "countries",
      emoji: "🌍",
      label: wrapped.countries.length === 1 ? "Country explored" : "Countries explored",
      value: wrapped.countries.length,
      detail: wrapped.countries.join(", "),
      color: "pink",
    },
    {
      key: "continents",
      emoji: "🗺️",
      label: wrapped.continents.length === 1 ? "Continent" : "Continents",
      value: wrapped.continents.length,
      detail: wrapped.continents.join(", "),
      color: "purple",
    },
  ];
  if (wrapped.longest_trip) {
    slides.push({
      key: "longest",
      emoji: "🏆",
      label: "Your longest trip",
      value: wrapped.longest_trip.days,
      detail: `days on ${wrapped.longest_trip.title}`,
      color: "purple",
    });
  }
  if (wrapped.cities.length > 0) {
    slides.push({
      key: "cities",
      emoji: "📍",
      label: wrapped.cities.length === 1 ? "City visited" : "Cities visited",
      value: wrapped.cities.length,
      detail: wrapped.cities.slice(0, 4).join(", "),
      color: "pink",
    });
  }
  slides.push(
    { key: "tease", emoji: "🥁", label: "And your travel personality is…", color: "purple" },
    { key: "personality", emoji: "✨", label: "Your travel personality", text: wrapped.personality, detail: wrapped.personality_reason, color: "pink" },
  );
  return slides;
}

function prefersReducedMotion() {
  return typeof window === "undefined" || !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Counts from 0 up to `target` over about a second. Starts at the final number
// if the browser can't animate or the user prefers less motion.
function useCountUp(target: number) {
  const canAnimate = !prefersReducedMotion() && typeof requestAnimationFrame !== "undefined";
  const [shown, setShown] = useState(canAnimate ? 0 : target);

  useEffect(() => {
    if (!canAnimate) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1000, 1);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3)))); // ease out
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, canAnimate]);

  return shown;
}

function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

type WrappedStoryProps = {
  wrapped: Wrapped;
  onClose: () => void;
};

// Full-screen, Spotify Wrapped–style story: one stat per slide, with progress bars,
// tap/arrow-key navigation, and slides that move on by themselves.
export default function WrappedStory({ wrapped, onClose }: WrappedStoryProps) {
  const slides = buildSlides(wrapped);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const last = slides.length - 1;
  const slide = slides[index];

  const next = () => setIndex((i) => Math.min(i + 1, last));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  // Move on by itself, unless paused or already on the last slide.
  useEffect(() => {
    if (paused || index === last) return;
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, last]);

  // Keep the page behind from scrolling while the story is open.
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  // Keyboard controls: arrows to move, space to pause, Escape to close.
  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, last));
      else if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      else if (event.key === "Escape") onClose();
      else if (event.key === " ") {
        event.preventDefault();
        setPaused((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onClose]);

  const background =
    slide.color === "pink"
      ? "from-pink-500 via-pink-400 to-purple-600"
      : "from-purple-700 via-purple-600 to-pink-500";

  // Render on <body> so the story always covers the whole screen, whatever the page layout is.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Your ${wrapped.year} Travel Wrapped`}
      className={`fixed inset-0 z-50 flex flex-col bg-gradient-to-br ${background} text-white transition-colors duration-700`}
    >
      {/* Progress bars, one per slide */}
      <div className="flex gap-1.5 px-4 pt-4">
        {slides.map((s, i) => (
          <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className={`h-full rounded-full bg-white ${i === index && index !== last ? "wrapped-progress" : ""}`}
              style={{
                width: i < index || (i === index && index === last) ? "100%" : i === index ? undefined : "0%",
                animationDuration: `${SLIDE_MS}ms`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-pink-100">Travel Wrapped {wrapped.year}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold transition hover:bg-white/30 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {paused ? "Play" : "Pause"}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close Wrapped"
            className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/30 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tap the left side to go back, the right side to go forward */}
      <div className="relative flex flex-1 items-center justify-center px-6">
        <button type="button" tabIndex={-1} aria-label="Previous slide" onClick={back} className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize outline-none" />
        <button type="button" tabIndex={-1} aria-label="Next slide" onClick={next} className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize outline-none" />

        <div key={slide.key} aria-live="polite" className="wrapped-pop pointer-events-none max-w-xl text-center">
          <p className="text-6xl">{slide.emoji}</p>
          <p className="mt-5 text-lg font-semibold uppercase tracking-widest text-pink-100">{slide.label}</p>
          {slide.value !== undefined && (
            <p className="mt-3 text-8xl font-bold tabular-nums">
              <CountUp value={slide.value} />
            </p>
          )}
          {slide.text && <p className="mt-3 text-5xl font-bold sm:text-6xl">{slide.text}</p>}
          {slide.detail && <p className="mt-4 text-lg text-purple-50">{slide.detail}</p>}

          {index === last && (
            <div className="pointer-events-auto mt-10 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="rounded-full bg-white px-6 py-2.5 font-semibold text-purple-800 transition hover:bg-pink-50"
              >
                Replay
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/70 px-6 py-2.5 font-semibold transition hover:bg-white/15"
              >
                See all stats
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="pb-5 text-center text-sm text-purple-100">
        {index + 1} / {slides.length}
      </p>
    </div>,
    document.body,
  );
}
