import { CONTINENTS } from "@/lib/worldCountries";

type FilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  continent: string; // "all" or a continent name
  onContinentChange: (value: string) => void;
  // Optional year dropdown: "all" or a year like "2024", plus the years to offer.
  year?: string;
  onYearChange?: (value: string) => void;
  years?: string[];
  // Extra controls, like the trips page's sort dropdown.
  children?: React.ReactNode;
};

// The search box + continent (and optional year) dropdowns above the country and trip lists.
export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  continent,
  onContinentChange,
  year,
  onYearChange,
  years = [],
  children,
}: FilterBarProps) {
  const inputClass =
    "rounded-xl border border-purple-200 bg-white px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <label className="flex-1">
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full ${inputClass}`}
        />
      </label>

      <label>
        <span className="sr-only">Continent</span>
        <select
          value={continent}
          onChange={(event) => onContinentChange(event.target.value)}
          className={`w-full ${inputClass}`}
        >
          <option value="all">All continents</option>
          {CONTINENTS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      {year !== undefined && onYearChange && (
        <label>
          <span className="sr-only">Year</span>
          <select
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            className={`w-full ${inputClass}`}
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}

      {children}
    </div>
  );
}
