"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StatusViews";
import { errorMessage, getCountries, type Country } from "@/lib/api";
import { getRecommendations } from "@/lib/recommendations";

type Status = "loading" | "error" | "ready";

export default function RecommendationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getCountries()
      .then((data) => {
        setCountries(data);
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

  // The suggestions are worked out right here in the browser from the
  // countries you've visited (see lib/recommendations.ts for the rules).
  const visitedNames = countries.map((country) => country.name);
  const recommendations = getRecommendations(visitedNames);
  // Only promise a "new continent" pick when there's one to show.
  const hasNewContinentPick = recommendations.some((rec) => rec.isNewContinent);

  return (
    <PageLayout
      title="Recommendations"
      subtitle="Where to go next, based on where you've already been."
    >
      {status === "loading" && <LoadingState message="Finding your next destination…" />}

      {status === "error" && (
        <ErrorState title="We couldn't load your recommendations." message={loadError} onRetry={reload} />
      )}

      {status === "ready" && countries.length === 0 && (
        <div className="mt-8">
          <EmptyState
            emoji="🧭"
            title="We need a little more to go on"
            message="Recommendations are based on the countries you've visited. Add a few on the Been page, or load sample data."
            onSampleLoaded={reload}
          />
        </div>
      )}

      {status === "ready" && countries.length > 0 && (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-purple-700">
            How it works: we look at the continents where you&apos;ve visited the most countries and
            suggest popular places there you haven&apos;t been yet
            {hasNewContinentPick
              ? ", plus one pick on a continent you haven't explored."
              : ". You've been to every continent, so all of these come from your favorites."}
          </p>

          {recommendations.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-purple-900">You&apos;ve been everywhere on our list! 🎉</p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <li
                  key={rec.country}
                  className={`rounded-3xl p-6 shadow-sm ${
                    rec.isNewContinent ? "bg-gradient-to-br from-pink-100 to-purple-100" : "bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                      {rec.continent}
                    </span>
                    {rec.isNewContinent && (
                      <span className="rounded-full bg-pink-300 px-2.5 py-0.5 text-xs font-semibold text-purple-950">
                        New continent
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-purple-950">{rec.country}</h2>
                  <p className="mt-2 text-slate-700">
                    <span className="font-semibold text-purple-800">Why: </span>
                    {rec.why}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PageLayout>
  );
}
