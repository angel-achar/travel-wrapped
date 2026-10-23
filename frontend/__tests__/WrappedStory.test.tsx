import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WrappedStory, { buildSlides } from "@/components/wrapped/WrappedStory";
import type { Wrapped } from "@/lib/api";

const wrapped: Wrapped = {
  year: 2025,
  available_years: [2025],
  trips_taken: 4,
  days_traveled: 23,
  countries: ["Japan", "Kenya"],
  continents: ["Asia", "Africa"],
  cities: ["Tokyo", "Nairobi"],
  top_destination: "Japan",
  longest_trip: { id: 7, title: "Japan Spring", days: 10 },
  personality: "The Explorer",
  personality_reason: "You went somewhere new on every trip.",
};

describe("buildSlides", () => {
  it("ends with the personality reveal", () => {
    const slides = buildSlides(wrapped);
    expect(slides[0].key).toBe("intro");
    expect(slides.at(-2)?.key).toBe("tease");
    expect(slides.at(-1)?.text).toBe("The Explorer");
  });

  it("skips slides with nothing to show", () => {
    const keys = buildSlides({ ...wrapped, top_destination: null, longest_trip: null, cities: [] }).map((s) => s.key);
    expect(keys).not.toContain("top");
    expect(keys).not.toContain("longest");
    expect(keys).not.toContain("cities");
  });
});

describe("WrappedStory", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts on the intro and moves forward with the arrow key and the next button", () => {
    render(<WrappedStory wrapped={wrapped} onClose={() => {}} />);
    expect(screen.getByText("Your 2025")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Trips taken")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("Days traveled")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Trips taken")).toBeInTheDocument();
  });

  it("moves on by itself, and stops moving when paused", () => {
    vi.useFakeTimers();
    render(<WrappedStory wrapped={wrapped} onClose={() => {}} />);

    act(() => vi.advanceTimersByTime(4500));
    expect(screen.getByText("Trips taken")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByText("Trips taken")).toBeInTheDocument();
  });

  it("reveals the personality at the end and can replay or close", () => {
    const onClose = vi.fn();
    render(<WrappedStory wrapped={wrapped} onClose={onClose} />);
    const total = buildSlides(wrapped).length;
    for (let i = 1; i < total; i++) fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText("The Explorer")).toBeInTheDocument();
    expect(screen.getByText(`${total} / ${total}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByText("Your 2025")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
