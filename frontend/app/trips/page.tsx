"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import FilterBar from "@/components/common/FilterBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StatusViews";
import TripCard from "@/components/trips/TripCard";
import { errorMessage, getTrips, type Trip } from "@/lib/api";
import { filterAndSortTrips, tripYears, type TripSort } from "@/lib/filters";

type Status = "loading" | "error" | "ready";

const newTripButton = (
  <Link
    href="/trips/new"
    className="rounded-full bg-pink-300 px-6 py-2.5 font-semibold text-purple-950 shadow-sm transition hover:bg-pink-200"
  >
    + New trip
  </Link>
);

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Filter controls
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("all");
  const [sort, setSort] = useState<TripSort>("newest");
  const [year, setYear] = useState("all");

  useEffect(() => {
    getTrips()
      .then((data) => {
        setTrips(data);
        setStatus("ready");
      })
      .catch((err) => {
        setLoadError(errorMessage(err));
        setStatus("error");
      });
  }, [reloadKey]);

  function reload() {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }

  const visibleTrips = filterAndSortTrips(trips, search, continent, sort, year);

  return (
    <PageLayout title="Trips" subtitle="Every trip you've taken, in one place." actions={newTripButton}>
      {status === "loading" && <LoadingState message="Loading your trips…" />}

      {status === "error" && (
        <ErrorState title="We couldn't load your trips." message={loadError} onRetry={reload} />
      )}

      {status === "ready" && trips.length === 0 && (
        <div className="mt-8">
          <EmptyState
            emoji="🧳"
            title="No trips yet"
            message="Add your first trip, or load sample data to see how the app works."
            onSampleLoaded={reload}
          >
            {newTripButton}
          </EmptyState>
        </div>
      )}

      {status === "ready" && trips.length > 0 && (
        <div className="mt-8 space-y-6">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by title, country, or city"
            continent={continent}
            onContinentChange={setContinent}
            year={year}
            onYearChange={setYear}
            years={tripYears(trips)}
          >
            <label>
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                // The select gives us a plain string, so we tell TypeScript it's a TripSort.
                onChange={(event) => setSort(event.target.value as TripSort)}
                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </label>
          </FilterBar>

          <p className="text-sm text-purple-700">
            Showing {visibleTrips.length} of {trips.length} trips
          </p>

          {visibleTrips.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-white p-8 text-center">
              <p className="font-semibold text-purple-900">No trips match your filters.</p>
              <p className="mt-1 text-purple-700">Try a different search or continent.</p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {visibleTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </ul>
          )}
        </div>
      )}
    </PageLayout>
  );
}
