"use client";

// "use client" means this page runs in the browser, which we need for
// useState, useEffect, and button clicks.

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import AddCountryForm from "@/components/been/AddCountryForm";
import CountryList from "@/components/been/CountryList";
import StatsCard from "@/components/been/StatsCard";
import ContinentBarChart from "@/components/common/ContinentBarChart";
import FilterBar from "@/components/common/FilterBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StatusViews";
import {
  addCountry,
  deleteCountry,
  errorMessage,
  getCountries,
  getStats,
  type Country,
  type NewCountry,
  type Stats,
} from "@/lib/api";
import { filterCountries } from "@/lib/filters";

// The page is always in exactly one of these three states.
type Status = "loading" | "error" | "ready";

// Gets everything the page needs. Promise.all runs both requests at the
// same time and waits until both are done.
async function fetchPageData() {
  const [countries, stats] = await Promise.all([getCountries(), getStats()]);
  return { countries, stats };
}

export default function BeenPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");

  // Bumping this number tells the useEffect below to fetch again.
  // We do that after adding or deleting so the list and stats update.
  const [reloadKey, setReloadKey] = useState(0);

  // Which country is being deleted right now (to disable its button),
  // and any error from deleting.
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Search box and continent dropdown above the list.
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("all");

  // Runs when the page first appears, and again whenever reloadKey changes.
  useEffect(() => {
    fetchPageData()
      .then((data) => {
        setCountries(data.countries);
        setStats(data.stats);
        setStatus("ready");
      })
      .catch((err) => {
        setLoadError(errorMessage(err));
        setStatus("error");
      });
  }, [reloadKey]);

  function reload() {
    setReloadKey((key) => key + 1);
  }

  function handleRetry() {
    setStatus("loading");
    reload();
  }

  // Passed to AddCountryForm. If addCountry throws (e.g. duplicate),
  // the error goes back up to the form, which shows it.
  async function handleAdd(country: NewCountry) {
    await addCountry(country);
    reload();
  }

  async function handleDelete(id: number) {
    setDeleteError(null);
    setDeletingId(id);
    try {
      await deleteCountry(id);
      reload();
    } catch (err) {
      setDeleteError(errorMessage(err, "Could not remove country."));
    } finally {
      setDeletingId(null);
    }
  }

  // Recomputed on every render, so it always matches the current filters.
  const visibleCountries = filterCountries(countries, search, continent);

  return (
    <PageLayout title="Been Tracker" subtitle="Keep track of every country you've visited.">
      {/* Loading state */}
      {status === "loading" && <LoadingState message="Loading your countries…" />}

      {/* Error state (e.g. the backend isn't running) */}
      {status === "error" && (
        <ErrorState
          title="We couldn't load your countries."
          message={loadError}
          onRetry={handleRetry}
        />
      )}

      {/* Ready state: show stats, form, and list */}
      {status === "ready" && stats && (
        <div className="mt-8 space-y-8">
          <StatsCard stats={stats} />

          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <div className="space-y-8">
              <AddCountryForm onAdd={handleAdd} />

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">By continent</h2>
                <ContinentBarChart data={stats.by_continent} />
              </section>
            </div>

            <section aria-label="Countries you've visited">
              <h2 className="mb-4 text-xl font-bold">
                Your countries{" "}
                <span className="text-base font-medium text-purple-600">
                  ({visibleCountries.length} of {countries.length})
                </span>
              </h2>

              {countries.length === 0 ? (
                // Empty state: nothing saved yet.
                <EmptyState
                  emoji="🌍"
                  title="No countries yet…"
                  message="Add the first country you've been to using the form, or load sample data to look around."
                  onSampleLoaded={reload}
                />
              ) : (
                <div className="space-y-4">
                  <FilterBar
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search countries or cities"
                    continent={continent}
                    onContinentChange={setContinent}
                  />
                  <p role="alert" aria-live="assertive" className="text-sm font-medium text-red-600">
                    {deleteError}
                  </p>
                  <CountryList
                    countries={visibleCountries}
                    deletingId={deletingId}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
