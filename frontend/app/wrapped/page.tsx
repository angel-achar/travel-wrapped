"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StatusViews";
import WrappedCard from "@/components/wrapped/WrappedCard";
import WrappedStory from "@/components/wrapped/WrappedStory";
import PersonalityLegend from "@/components/wrapped/PersonalityLegend";
import { errorMessage, getWrapped, type Wrapped } from "@/lib/api";

type Status = "loading" | "error" | "ready";

export default function WrappedPage() {
  // undefined = "let the backend pick" (the most recent year with trips).
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [wrapped, setWrapped] = useState<Wrapped | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    getWrapped(selectedYear)
      .then((data) => {
        setWrapped(data);
        setStatus("ready");
      })
      .catch((err) => {
        setLoadError(errorMessage(err));
        setStatus("error");
      });
  }, [selectedYear, reloadKey]);

  function reload() {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }

  function handleYearChange(year: number) {
    setStatus("loading");
    setSelectedYear(year);
  }

  // Years in the dropdown: every year with trips, plus this year.
  const yearOptions: number[] = [];
  if (wrapped) {
    const thisYear = new Date().getFullYear();
    yearOptions.push(...wrapped.available_years);
    if (!yearOptions.includes(thisYear)) yearOptions.push(thisYear);
    if (!yearOptions.includes(wrapped.year)) yearOptions.push(wrapped.year);
    yearOptions.sort((a, b) => b - a); // newest first
  }

  const hasAnyTrips = wrapped !== null && wrapped.available_years.length > 0;

  // A dropdown works for any number of years. We hide the browser's own arrow
  // (appearance-none) and draw our own, so it sits evenly inside the box.
  const yearPicker = wrapped && hasAnyTrips && (
    <label className="flex items-center gap-2 font-semibold text-purple-900">
      Year
      <span className="relative">
        <select
          value={wrapped.year}
          onChange={(event) => handleYearChange(Number(event.target.value))}
          className="appearance-none rounded-full border-2 border-purple-200 bg-white py-1.5 pl-4 pr-10 font-semibold text-purple-950 shadow-sm outline-none transition hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-700"
        >
          <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );

  return (
    <PageLayout title="Travel Wrapped" subtitle="Your year in travel, wrapped up." actions={yearPicker}>
      {status === "loading" && <LoadingState message="Wrapping up your year…" />}

      {status === "error" && (
        <ErrorState title="We couldn't build your recap." message={loadError} onRetry={reload} />
      )}

      {status === "ready" && wrapped && !hasAnyTrips && (
        <div className="mt-8">
          <EmptyState
            emoji="🎁"
            title="No trips to wrap yet"
            message="Wrapped is built from your trips. Add a trip with dates, or load sample data to see a recap."
            onSampleLoaded={reload}
          >
            <Link
              href="/trips/new"
              className="rounded-full border border-purple-200 px-6 py-2.5 font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Add a trip
            </Link>
          </EmptyState>
        </div>
      )}

      {status === "ready" && wrapped && hasAnyTrips && wrapped.trips_taken === 0 && (
        <div className="mt-8">
          <EmptyState
            emoji="🛋️"
            title={`No trips in ${wrapped.year}`}
            message="Pick another year above, or add a trip for this year."
          >
            <Link
              href="/trips/new"
              className="rounded-full bg-pink-300 px-6 py-2.5 font-semibold text-purple-950 transition hover:bg-pink-200"
            >
              Add a trip
            </Link>
          </EmptyState>
        </div>
      )}

      {status === "ready" && wrapped && wrapped.trips_taken > 0 && (
        <div className="mt-8 space-y-6">
          {/* The big "headline" card */}
          <section className="rounded-[2rem] bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-pink-100">
              Your {wrapped.year} travel personality
            </p>
            <p className="mt-3 text-5xl font-bold">{wrapped.personality}</p>
            <p className="mt-3 text-lg text-purple-100">{wrapped.personality_reason}</p>
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="mt-6 rounded-full bg-white px-6 py-2.5 font-semibold text-purple-800 shadow-sm transition hover:bg-pink-50"
            >
              ▶ Play your Wrapped
            </button>
          </section>

          {playing && <WrappedStory wrapped={wrapped} onClose={() => setPlaying(false)} />}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <WrappedCard emoji="🧳" label="Trips taken" value={String(wrapped.trips_taken)} />
            <WrappedCard emoji="📅" label="Days traveled" value={String(wrapped.days_traveled)} />
            <WrappedCard
              emoji="🌍"
              label={wrapped.countries.length === 1 ? "Country" : "Countries"}
              value={String(wrapped.countries.length)}
              detail={wrapped.countries.join(", ")}
            />
            {wrapped.longest_trip && (
              <WrappedCard
                emoji="🏆"
                label="Longest trip"
                value={`${wrapped.longest_trip.days} days`}
                detail={wrapped.longest_trip.title}
                href={`/trips/${wrapped.longest_trip.id}`}
                color="pink"
              />
            )}
            <WrappedCard
              emoji="🗺️"
              label={wrapped.continents.length === 1 ? "Continent" : "Continents"}
              value={String(wrapped.continents.length)}
              detail={wrapped.continents.join(", ")}
            />
            <WrappedCard
              emoji="📍"
              label={wrapped.cities.length === 1 ? "City" : "Cities"}
              value={String(wrapped.cities.length)}
              detail={wrapped.cities.slice(0, 4).join(", ") + (wrapped.cities.length > 4 ? ", …" : "")}
              color="pink"
            />
          </div>

          <PersonalityLegend current={wrapped.personality} />
        </div>
      )}
    </PageLayout>
  );
}
