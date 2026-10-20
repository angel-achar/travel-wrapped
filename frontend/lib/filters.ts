// Plain functions for searching, filtering, and sorting lists on the page.
// They don't touch React or the network, which makes them easy to test.

import type { Country, Trip } from "@/lib/api";

// "all" means "don't filter by continent".
export type ContinentFilter = string;
export type TripSort = "newest" | "oldest" | "name";

// Does `text` contain `search`? Ignores capitals.
function matches(text: string, search: string): boolean {
  return text.toLowerCase().includes(search.trim().toLowerCase());
}

export function filterCountries(
  countries: Country[],
  search: string,
  continent: ContinentFilter,
): Country[] {
  return countries.filter((country) => {
    if (continent !== "all" && country.continent !== continent) {
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
): Trip[] {
  const filtered = trips.filter((trip) => {
    if (continent !== "all" && !trip.continents.includes(continent)) {
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
