// Plain functions for searching, filtering, and sorting lists on the page.
// They don't touch React or the network, which makes them easy to test.

import type { Country, Stats, Trip } from "@/lib/api";
import { CONTINENTS } from "@/lib/worldCountries";

// "all" means "don't filter by continent".
export type ContinentFilter = string;
export type TripSort = "newest" | "oldest" | "name";

// Does `text` contain `search`? Ignores capitals.
function matches(text: string, search: string): boolean {
  return text.toLowerCase().includes(search.trim().toLowerCase());
}

// "all" means "don't filter by year". Otherwise a 4-digit year like "2024".
export type YearFilter = string;

// A country counts for a year if you visited it then, or took a trip there that year.
function countryInYear(country: Country, year: YearFilter): boolean {
  if (year === "all") return true;
  if (country.visited_date?.startsWith(year)) return true;
  return country.trips.some((trip) => trip.start_date.startsWith(year));
}

// Every year that appears in the countries (visit dates and trips), newest first.
export function countryYears(countries: Country[]): string[] {
  const years = new Set<string>();
  for (const country of countries) {
    if (country.visited_date) years.add(country.visited_date.slice(0, 4));
    for (const trip of country.trips) years.add(trip.start_date.slice(0, 4));
  }
  return [...years].sort().reverse();
}

// Every year a trip started in, newest first.
export function tripYears(trips: Trip[]): string[] {
  return [...new Set(trips.map((trip) => trip.start_date.slice(0, 4)))].sort().reverse();
}

export function filterCountries(
  countries: Country[],
  search: string,
  continent: ContinentFilter,
  year: YearFilter = "all",
): Country[] {
  return countries.filter((country) => {
    if (continent !== "all" && country.continent !== continent) {
      return false;
    }
    if (!countryInYear(country, year)) {
      return false;
    }
    // A search matches the country name or any of its cities.
    return matches(country.name, search) || matches(country.cities.join(" "), search);
  });
}

export function filterAndSortTrips(
  trips: Trip[],
  search: string,
  continent: ContinentFilter,
  sort: TripSort,
  year: YearFilter = "all",
): Trip[] {
  const filtered = trips.filter((trip) => {
    if (continent !== "all" && !trip.continents.includes(continent)) {
      return false;
    }
    if (year !== "all" && !trip.start_date.startsWith(year)) {
      return false;
    }
    // A search matches the title, a country, or a city.
    const searchable = [trip.title, ...trip.countries, ...trip.cities].join(" ");
    return matches(searchable, search);
  });

  // .sort() changes the array in place, so we sort the filtered copy.
  // Dates are "YYYY-MM-DD" strings, which sort correctly as plain text.
  return filtered.sort((a, b) => {
    if (sort === "name") {
      return a.title.localeCompare(b.title);
    }
    if (sort === "oldest") {
      return a.start_date.localeCompare(b.start_date);
    }
    return b.start_date.localeCompare(a.start_date); // newest first
  });
}

// Recomputes the Been page's stats for just the given countries (for example,
// the ones from one year). Uses the same rules as the backend's /api/stats.
export function statsForCountries(countries: Country[], base: Stats): Stats {
  const perContinent: Record<string, number> = {};
  for (const country of countries) {
    perContinent[country.continent] = (perContinent[country.continent] ?? 0) + 1;
  }
  const byContinent = CONTINENTS.map((continent) => ({ continent, countries: perContinent[continent] ?? 0 }));
  let top: string | null = null;
  for (const item of byContinent) {
    if (item.countries > 0 && (top === null || item.countries > perContinent[top])) top = item.continent;
  }
  const cities = new Set(countries.flatMap((country) => country.cities.map((city) => city.toLowerCase())));
  return {
    ...base,
    countries_visited: countries.length,
    percent_of_world: Math.round((countries.length / base.total_countries) * 1000) / 10,
    continents_visited: byContinent.filter((item) => item.countries > 0).length,
    by_continent: byContinent,
    top_continent: top,
    cities_visited: cities.size,
  };
}
