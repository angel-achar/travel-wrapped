// Rule-based destination suggestions. No AI and no external APIs: just
// a few simple rules based on which continents you've visited most.

import { CONTINENTS, findCountry, type Continent } from "@/lib/worldCountries";

export type Recommendation = {
  country: string;
  continent: Continent;
  why: string; // a short sentence explaining the pick
  isNewContinent: boolean;
};

// A short, hand-picked list of popular destinations per continent, in the
// order we'd suggest them, with one thing each place is known for.
const HIGHLIGHTS: Record<Continent, { country: string; knownFor: string }[]> = {
  Africa: [
    { country: "Morocco", knownFor: "the souks of Marrakech and the Sahara" },
    { country: "South Africa", knownFor: "Cape Town and safari parks" },
    { country: "Egypt", knownFor: "the pyramids and the Nile" },
    { country: "Kenya", knownFor: "the Great Migration in the Maasai Mara" },
    { country: "Tanzania", knownFor: "Kilimanjaro and Zanzibar's beaches" },
    { country: "Namibia", knownFor: "the red dunes of Sossusvlei" },
  ],
  Asia: [
    { country: "Japan", knownFor: "Kyoto's temples and Tokyo's food" },
    { country: "Thailand", knownFor: "street food and island hopping" },
    { country: "Vietnam", knownFor: "Ha Long Bay and pho" },
    { country: "South Korea", knownFor: "Seoul's palaces and night markets" },
    { country: "Indonesia", knownFor: "Bali's rice terraces" },
    { country: "India", knownFor: "the Taj Mahal and regional cuisines" },
    { country: "Singapore", knownFor: "hawker centers and Gardens by the Bay" },
  ],
  Europe: [
    { country: "Italy", knownFor: "Rome, Florence, and the Amalfi Coast" },
    { country: "France", knownFor: "Paris and the French Riviera" },
    { country: "Spain", knownFor: "Barcelona's architecture and tapas" },
    { country: "Portugal", knownFor: "Lisbon's tiled streets and pastel de nata" },
    { country: "Greece", knownFor: "island sunsets and ancient ruins" },
    { country: "Iceland", knownFor: "waterfalls, glaciers, and northern lights" },
    { country: "Croatia", knownFor: "Dubrovnik and the Adriatic coast" },
  ],
  "North America": [
    { country: "Mexico", knownFor: "Mexico City's food scene and Mayan ruins" },
    { country: "Canada", knownFor: "the Rockies and Montreal" },
    { country: "Costa Rica", knownFor: "rainforests and wildlife" },
    { country: "United States", knownFor: "national parks and big cities" },
    { country: "Panama", knownFor: "the canal and San Blas islands" },
    { country: "Jamaica", knownFor: "beaches and reggae" },
  ],
  "South America": [
    { country: "Peru", knownFor: "Machu Picchu and Lima's restaurants" },
    { country: "Argentina", knownFor: "Patagonia and Buenos Aires" },
    { country: "Chile", knownFor: "the Atacama Desert and Torres del Paine" },
    { country: "Colombia", knownFor: "Cartagena and coffee country" },
    { country: "Brazil", knownFor: "Rio and the Amazon" },
    { country: "Ecuador", knownFor: "the Galapagos Islands" },
  ],
  Oceania: [
    { country: "Australia", knownFor: "Sydney and the Great Barrier Reef" },
    { country: "New Zealand", knownFor: "fjords and hiking trails" },
    { country: "Fiji", knownFor: "coral reefs and island resorts" },
    { country: "Samoa", knownFor: "waterfalls and lagoons" },
  ],
};

// How many suggestions to make for each of your top continents.
const PICKS_PER_CONTINENT = 2;
// How many of your most-visited continents to suggest from.
const TOP_CONTINENTS = 2;

export function getRecommendations(visitedNames: string[]): Recommendation[] {
  // Step 1: count how many countries you've visited on each continent.
  const visited = new Set<string>();
  const counts: Record<string, number> = {};
  for (const name of visitedNames) {
    const country = findCountry(name);
    if (!country) continue; // skip names that aren't in the list
    visited.add(country.name);
    counts[country.continent] = (counts[country.continent] ?? 0) + 1;
  }

  // Step 2: your continents, most-visited first (ties keep the CONTINENTS order).
  const yourContinents = CONTINENTS.filter((continent) => (counts[continent] ?? 0) > 0);
  yourContinents.sort((a, b) => counts[b] - counts[a]);

  const results: Recommendation[] = [];

  // Step 3: for your top continents, suggest popular places you haven't been.
  for (const continent of yourContinents.slice(0, TOP_CONTINENTS)) {
    const notVisited = HIGHLIGHTS[continent].filter((pick) => !visited.has(pick.country));
    for (const pick of notVisited.slice(0, PICKS_PER_CONTINENT)) {
      const count = counts[continent];
      const plural = count === 1 ? "country" : "countries";
      results.push({
        country: pick.country,
        continent,
        why: `You've been to ${count} ${plural} in ${continent}. ${pick.country} is known for ${pick.knownFor}.`,
        isNewContinent: false,
      });
    }
  }

  // Step 4: one "new continent" pick, from the first continent you haven't visited.
  const newContinent = CONTINENTS.find((continent) => (counts[continent] ?? 0) === 0);
  if (newContinent) {
    const pick = HIGHLIGHTS[newContinent][0];
    results.push({
      country: pick.country,
      continent: newContinent,
      why: `You haven't been to ${newContinent} yet. ${pick.country} is a great first stop, known for ${pick.knownFor}.`,
      isNewContinent: true,
    });
  }

  return results;
}
