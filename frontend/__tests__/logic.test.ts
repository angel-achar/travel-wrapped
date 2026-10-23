// Tests for the plain (non-React) logic files.
import { beforeEach, describe, expect, it } from "vitest";
import type { Trip } from "@/lib/api";
import { filterAndSortTrips } from "@/lib/filters";
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
