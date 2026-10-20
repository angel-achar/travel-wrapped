"use client";

// "use client" because the hero loads your real stats from the API and
// the "View Demo" button runs code when clicked.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStats, loadSampleData, type Stats } from "@/lib/api";

export default function Hero() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Load this browser's real numbers once when the page opens.
  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch(() => setStatsFailed(true));
  }, []);

  // "View Demo": fill this browser's workspace with sample trips (only if
  // it's empty), then open the dashboard.
  async function handleViewDemo() {
    setDemoLoading(true);
    try {
      await loadSampleData();
    } catch {
      // If the API is down, the dashboard will show its own error message.
    }
    router.push("/dashboard");
  }

  // What to show in the number spots: "…" while loading, "—" if the API failed.
  function show(value: number | undefined): string {
    if (statsFailed) return "—";
    if (value === undefined) return "…";
    return String(value);
  }

  let statsCaption = "Loading your stats…";
  if (statsFailed) {
    statsCaption = "Live stats are unavailable right now.";
  } else if (stats && stats.countries_visited === 0 && stats.total_trips === 0) {
    statsCaption = "Your stats are empty. Click View Demo to load sample trips, or add your own.";
  } else if (stats) {
    statsCaption = "Live numbers from your workspace.";
  }

  return (
    <section className="relative min-h-[calc(100vh-84px)] overflow-hidden px-6 py-16 lg:px-16">
      <Image
        src="/images/hero/homeBG.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-950/45" />

      {/* Purple tint over the background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/45 via-purple-900/20 to-transparent" />

      {/* Main hero row */}
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Left side */}
        <div>
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
            ✈️ Your year in travel
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Turn your adventures into

            <span className="mt-2 block">
              Travel{" "}
              <span className="text-pink-300">
                Wrapped
              </span>
            </span>
          </h1>

          {/* Tagline */}
          <p className="font-rounded mt-5 text-xl font-semibold leading-snug text-pink-200 sm:text-2xl">
            {"You've already done the hard work traveling. Let us do something for you."}
          </p>

          <p className="mt-4 max-w-xl text-lg leading-8 text-purple-100 sm:text-xl">
            Track every place you have been, save your favorite memories, and
            create a beautiful recap of your year.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-pink-300 px-7 py-3 text-center font-semibold text-purple-950 shadow-lg transition hover:scale-105 hover:bg-pink-200"
            >
              Get Started
            </Link>

            <button
              type="button"
              onClick={handleViewDemo}
              disabled={demoLoading}
              className="rounded-full border border-white/30 bg-white/10 px-7 py-3 text-center font-semibold text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/20 disabled:opacity-70"
            >
              {demoLoading ? "Loading demo…" : "View Demo"}
            </button>
          </div>
        </div>

        {/* Right-side preview, filled with your real stats */}
        <div className="hidden items-center justify-center lg:flex">
          <div className="w-full max-w-md rotate-2 rounded-[2rem] border border-white/20 bg-white/15 p-5 shadow-2xl backdrop-blur-xl">
            {/* Preview header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">
                  Your travel so far
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  Travel Wrapped
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-300 text-2xl">
                ✈️
              </div>
            </div>

            {/* Inner white card */}
            <div className="mt-5 rounded-3xl bg-white/90 p-5 shadow-lg">
              <p className="text-sm font-medium text-purple-600">
                Your travel at a glance
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-purple-100 p-4">
                  <p className="text-3xl font-bold text-purple-700">
                    {show(stats?.countries_visited)}
                  </p>

                  <p className="mt-1 text-sm text-purple-900">
                    Countries
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-100 p-4">
                  <p className="text-3xl font-bold text-pink-600">
                    {show(stats?.cities_visited)}
                  </p>

                  <p className="mt-1 text-sm text-pink-900">
                    Cities
                  </p>
                </div>
              </div>

              {/* Percent of the world, as a progress bar */}
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
                <p className="text-sm font-semibold text-purple-800">
                  {show(stats?.percent_of_world)}% of the world explored
                </p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400"
                    style={{ width: `${stats ? stats.percent_of_world : 0}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-purple-800">
                  Top continent: <strong>{stats?.top_continent ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom statistics (real numbers from the API) */}
      <div className="relative z-10 mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
        <StatCard
          emoji="🌍"
          value={show(stats?.countries_visited)}
          title="Countries Explored"
        />

        <StatCard
          emoji="📍"
          value={show(stats?.cities_visited)}
          title="Cities Visited"
        />

        <StatCard
          emoji="🧳"
          value={show(stats?.total_trips)}
          title="Trips Taken"
        />
      </div>
      <p className="relative z-10 mt-4 text-center text-sm text-purple-100">{statsCaption}</p>
    </section>
  );
}

type StatCardProps = {
  emoji: string;
  value: string;
  title: string;
};

function StatCard({
  emoji,
  value,
  title,
}: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl">
          {emoji}
        </div>

        <div>
          <p className="text-3xl font-bold text-pink-300">
            {value}
          </p>

          <p className="mt-1 text-purple-100">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
