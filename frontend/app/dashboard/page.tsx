"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ContinentBarChart from "@/components/common/ContinentBarChart";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StatusViews";
import StatTile from "@/components/dashboard/StatTile";
import { clearWorkspace, errorMessage, getStats, getTrips, type Stats, type Trip } from "@/lib/api";
import { getWorkspaceId } from "@/lib/workspace";

type Status = "loading" | "error" | "ready";

async function fetchDashboardData() {
  const [stats, trips] = await Promise.all([getStats(), getTrips()]);
  return { stats, trips };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [workspaceId, setWorkspaceId] = useState("");
  const [clearError, setClearError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData()
      .then((data) => {
        setStats(data.stats);
        setTrips(data.trips);
        // Read the id here (in the browser), not during the first render,
        // because the server doesn't have localStorage.
        setWorkspaceId(getWorkspaceId());
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

  async function handleClear() {
    if (!window.confirm("Delete every country and trip in this browser's workspace?")) {
      return;
    }
    setClearError(null);
    try {
      await clearWorkspace();
      reload();
    } catch (err) {
      setClearError(errorMessage(err, "Could not clear your data."));
    }
  }

  const isEmpty = stats !== null && stats.countries_visited === 0 && stats.total_trips === 0;
  // The trips come back newest first, so the first 3 are the most recent.
  const recentTrips = trips.slice(0, 3);

  return (
    <PageLayout title="Dashboard" subtitle="Your travel at a glance.">
      {status === "loading" && <LoadingState message="Crunching your travel numbers…" />}

      {status === "error" && (
        <ErrorState title="We couldn't load your dashboard." message={loadError} onRetry={reload} />
      )}

      {status === "ready" && isEmpty && (
        <div className="mt-8">
          <EmptyState
            emoji="📊"
            title="Nothing to show yet"
            message="Add a country or a trip and your insights will appear here. Or load sample data to explore."
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

      {status === "ready" && stats && !isEmpty && (
        <div className="mt-8 space-y-8">
          <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile value={String(stats.countries_visited)} label="Countries visited" />
            <StatTile value={`${stats.continents_visited} / 6`} label="Continents" />
            <StatTile value={`${stats.percent_of_world}%`} label="Of the world" highlight />
            <StatTile value={String(stats.total_trips)} label="Trips taken" />
            <StatTile value={String(stats.total_trip_days)} label="Days on the road" />
            <StatTile value={stats.top_continent ?? "—"} label="Top continent" highlight />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Countries per continent</h2>
              <ContinentBarChart data={stats.by_continent} />
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Recent trips</h2>
                <Link href="/trips" className="text-sm font-semibold text-purple-700 hover:underline">
                  See all →
                </Link>
              </div>
              {recentTrips.length === 0 ? (
                <p className="text-purple-700">
                  No trips yet.{" "}
                  <Link href="/trips/new" className="font-semibold underline">
                    Add one
                  </Link>
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentTrips.map((trip) => (
                    <li key={trip.id}>
                      <Link
                        href={`/trips/${trip.id}`}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-purple-50 p-4 transition hover:bg-purple-100"
                      >
                        <div>
                          <p className="font-semibold text-purple-950">{trip.title}</p>
                          <p className="text-sm text-purple-700">
                            {trip.start_date} · {trip.countries.join(", ")}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-pink-600">{trip.days} days</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Explains the workspace idea, since there are no accounts yet. */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-purple-200 bg-white/60 p-5 text-sm text-purple-800">
            <p>
              Your data is saved in a private workspace for this browser
              (<code className="rounded bg-purple-100 px-1.5 py-0.5">{workspaceId.slice(0, 8)}</code>).
              Other visitors can&apos;t see it.
            </p>
            <div>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-red-200 bg-white px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50"
              >
                Clear my data
              </button>
              {clearError && <p role="alert" className="mt-2 text-red-600">{clearError}</p>}
            </div>
          </section>
        </div>
      )}
    </PageLayout>
  );
}
