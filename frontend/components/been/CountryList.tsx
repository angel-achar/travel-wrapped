import type { Country } from "@/lib/api";

type CountryListProps = {
  countries: Country[];
  // The id of the country currently being deleted, or null if none.
  deletingId: number | null;
  onDelete: (id: number) => void;
};

export default function CountryList({
  countries,
  deletingId,
  onDelete,
}: CountryListProps) {
  // The page shows its own "no countries yet" state when the whole list is
  // empty, so if we get here with nothing it's because of the filters.
  if (countries.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-white p-8 text-center">
        <p className="font-semibold text-purple-900">No countries match your filters.</p>
        <p className="mt-1 text-purple-700">Try a different search or continent.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {countries.map((country) => (
        // "key" helps React track which item is which when the list changes.
        <li
          key={country.id}
          className="flex items-start justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-purple-950">{country.name}</p>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                {country.continent}
              </span>
            </div>

            {country.visited_date && (
              <p className="text-sm text-purple-700">
                Visited {country.visited_date}
              </p>
            )}

            {country.cities.length > 0 && (
              <p className="mt-1 text-sm text-slate-600">
                📍 {country.cities.join(", ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(country.id)}
            disabled={deletingId === country.id}
            // aria-label gives screen readers the full context ("Remove Japan").
            aria-label={`Remove ${country.name}`}
            className="rounded-full border border-purple-200 px-4 py-1.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingId === country.id ? "Removing…" : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  );
}
