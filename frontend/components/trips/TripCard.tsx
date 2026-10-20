import Link from "next/link";
import type { Trip } from "@/lib/api";

// One trip in the /trips list. The whole card links to the details page.
export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <li>
      <Link
        href={`/trips/${trip.id}`}
        className="block rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-purple-950">{trip.title}</h3>
          <span className="rounded-full bg-pink-100 px-3 py-0.5 text-sm font-semibold text-pink-700">
            {trip.days} {trip.days === 1 ? "day" : "days"}
          </span>
        </div>

        <p className="mt-1 text-sm text-purple-700">
          {trip.start_date} → {trip.end_date}
        </p>

        <p className="mt-2 text-sm text-slate-700">🌍 {trip.countries.join(", ")}</p>
        {trip.cities.length > 0 && (
          <p className="mt-1 text-sm text-slate-600">📍 {trip.cities.join(", ")}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {trip.continents.map((continent) => (
            <span
              key={continent}
              className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700"
            >
              {continent}
            </span>
          ))}
        </div>
      </Link>
    </li>
  );
}
