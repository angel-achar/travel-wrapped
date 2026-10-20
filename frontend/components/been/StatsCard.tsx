import type { Stats } from "@/lib/api";

type StatsCardProps = {
  stats: Stats;
};

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <section
      aria-label="Your travel stats"
      className="grid gap-4 sm:grid-cols-3"
    >
      <div className="rounded-3xl bg-purple-100 p-6 shadow-sm">
        <p className="text-4xl font-bold text-purple-700">
          {stats.countries_visited}
        </p>
        <p className="mt-1 text-purple-900">
          Countries visited (out of {stats.total_countries})
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-4xl font-bold text-purple-700">
          {stats.continents_visited}
        </p>
        <p className="mt-1 text-purple-900">Continents (out of 6)</p>
      </div>

      <div className="rounded-3xl bg-pink-100 p-6 shadow-sm">
        <p className="text-4xl font-bold text-pink-600">
          {stats.percent_of_world}%
        </p>
        <p className="mt-1 text-pink-900">Of the world explored</p>

        {/* Simple progress bar. The width is the percent we just showed. */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-pink-400"
            style={{ width: `${stats.percent_of_world}%` }}
          />
        </div>
      </div>
    </section>
  );
}
