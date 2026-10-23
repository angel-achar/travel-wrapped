// Tests for the plain (non-React) logic files.
import { beforeEach, describe, expect, it } from "vitest";
import type { Country, Trip } from "@/lib/api";
import { countryYears, filterAndSortTrips, filterCountries, statsForCountries, tripYears } from "@/lib/filters";
import { getRecommendations } from "@/lib/recommendations";
import { validateTrip } from "@/lib/tripValidation";
import { getWorkspaceId } from "@/lib/workspace";
import { CONTINENTS, WORLD_COUNTRIES, findCountry } from "@/lib/worldCountries";

describe("worldCountries", () => {
  it("has 195 countries, each on a known continent", () => {
    expect(WORLD_COUNTRIES).toHaveLength(195);
    for (const country of WORLD_COUNTRIES) {
      expect(CONTINENTS).toContain(country.continent);
    }
  });

  it("finds countries ignoring capitals and spaces", () => {
    expect(findCountry("  south KOREA ")?.name).toBe("South Korea");
    expect(findCountry("Narnia")).toBeUndefined();
    expect(findCountry("")).toBeUndefined();
  });

  it("understands nicknames, accents, and punctuation", () => {
    expect(findCountry("usa")?.name).toBe("United States");
    expect(findCountry("U.S.A.")?.name).toBe("United States");
    expect(findCountry("  the uk ")?.name).toBe("United Kingdom");
    expect(findCountry("England")?.name).toBe("United Kingdom");
    expect(findCountry("Korea")?.name).toBe("South Korea");
    expect(findCountry("Côte d'Ivoire")?.name).toBe("Ivory Coast");
    expect(findCountry("The Gambia")?.name).toBe("Gambia");
    expect(findCountry("guinea bissau")?.name).toBe("Guinea-Bissau");
    expect(findCountry("St Lucia")?.name).toBe("Saint Lucia");
    expect(findCountry("Bosnia & Herzegovina")?.name).toBe("Bosnia and Herzegovina");
  });
});

describe("filterAndSortTrips", () => {
  const trip = (title: string, start: string): Trip => ({
    id: 0, title, start_date: start, end_date: start, days: 1, countries: ["Japan"],
    continents: ["Asia"], cities: [], hotels: [], restaurants: [], activities: [], notes: "",
  });
  const trips = [trip("Beta", "2024-01-01"), trip("Alpha", "2023-01-01"), trip("Gamma", "2025-01-01")];

  it("sorts newest, oldest, and by name", () => {
    const titles = (sort: "newest" | "oldest" | "name") =>
      filterAndSortTrips(trips, "", "all", sort).map((t) => t.title);
    expect(titles("newest")).toEqual(["Gamma", "Beta", "Alpha"]);
    expect(titles("oldest")).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(titles("name")).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("doesn't change the original list", () => {
    filterAndSortTrips(trips, "", "all", "name");
    expect(trips[0].title).toBe("Beta");
  });
});

describe("validateTrip", () => {
  const good = {
    title: "Trip", start_date: "2025-01-01", end_date: "2025-01-01", countries: ["Japan"],
    cities: "", hotels: "", restaurants: "", activities: "", notes: "",
  };

  it("accepts a one-day trip", () => {
    expect(validateTrip(good)).toBeNull();
  });

  it("rejects a missing country", () => {
    expect(validateTrip({ ...good, countries: [] })).toBe("Add at least one country.");
  });
});

describe("getRecommendations", () => {
  it("suggests unvisited places on your top continent plus a new continent", () => {
    const recs = getRecommendations(["France", "Italy", "Japan"]);
    const names = recs.map((r) => r.country);

    // Europe is the top continent, so we get European picks you haven't been to.
    expect(names).toContain("Spain");
    expect(names).not.toContain("France");
    // Africa is the first continent you haven't visited.
    const newPick = recs.find((r) => r.isNewContinent);
    expect(newPick?.continent).toBe("Africa");
    expect(newPick?.why).toContain("haven't been to Africa");
  });

  it("only suggests a new continent when nothing is visited yet", () => {
    const recs = getRecommendations([]);
    expect(recs).toHaveLength(1);
    expect(recs[0].isNewContinent).toBe(true);
  });
});

describe("getWorkspaceId", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("makes an id once and then reuses it", () => {
    const first = getWorkspaceId();
    expect(first.length).toBeGreaterThan(10);
    expect(getWorkspaceId()).toBe(first);
  });

  it("switches workspace from a ?workspace= link", () => {
    window.history.pushState({}, "", "/dashboard?workspace=demo");
    expect(getWorkspaceId()).toBe("demo");
    // It's remembered after leaving the link.
    window.history.pushState({}, "", "/");
    expect(getWorkspaceId()).toBe("demo");
  });
});

describe("year filters", () => {
  const base = { continent: "Asia", cities: [], notes: "" };
  const countries: Country[] = [
    { ...base, id: 1, name: "Japan", visited_date: "2025-03-14", trips: [{ id: 1, title: "Spring", start_date: "2025-03-14" }] },
    { ...base, id: 2, name: "Thailand", visited_date: "2023-12-20", trips: [{ id: 2, title: "Back again", start_date: "2024-02-01" }] },
    { ...base, id: 3, name: "Vietnam", visited_date: null, trips: [] },
  ];

  it("filters countries by visit year or a trip that year", () => {
    expect(filterCountries(countries, "", "all", "2025").map((c) => c.name)).toEqual(["Japan"]);
    expect(filterCountries(countries, "", "all", "2024").map((c) => c.name)).toEqual(["Thailand"]);
    expect(filterCountries(countries, "", "all", "all")).toHaveLength(3);
    expect(countryYears(countries)).toEqual(["2025", "2024", "2023"]);
  });

  it("filters trips by the year they started", () => {
    const trip = (title: string, start: string): Trip => ({
      id: 0, title, start_date: start, end_date: start, days: 1, countries: ["Japan"],
      continents: ["Asia"], cities: [], hotels: [], restaurants: [], activities: [], notes: "",
    });
    const trips = [trip("A", "2024-06-01"), trip("B", "2025-01-02"), trip("C", "2024-12-30")];
    expect(filterAndSortTrips(trips, "", "all", "newest", "2024").map((t) => t.title)).toEqual(["C", "A"]);
    expect(tripYears(trips)).toEqual(["2025", "2024"]);
  });
});

describe("statsForCountries", () => {
  it("recounts countries, continents, percent, and cities for a subset", () => {
    const base = {
      countries_visited: 99, total_countries: 195, percent_of_world: 50, cities_visited: 99, continents_visited: 6,
      by_continent: [], top_continent: "Europe", total_trips: 9, total_trip_days: 82,
    };
    const make = (id: number, name: string, continent: string, cities: string[]): Country => ({
      id, name, continent, cities, visited_date: "2024-01-01", notes: "", trips: [],
    });
    const stats = statsForCountries(
      [make(1, "France", "Europe", ["Paris"]), make(2, "Italy", "Europe", ["Rome", "paris"]), make(3, "Peru", "South America", [])],
      base,
    );
    expect(stats.countries_visited).toBe(3);
    expect(stats.percent_of_world).toBe(1.5);
    expect(stats.continents_visited).toBe(2);
    expect(stats.top_continent).toBe("Europe");
    expect(stats.cities_visited).toBe(2); // Paris counted once
    expect(stats.by_continent.find((c) => c.continent === "Europe")?.countries).toBe(2);
    expect(stats.total_trips).toBe(9); // untouched fields carry over
  });
});
