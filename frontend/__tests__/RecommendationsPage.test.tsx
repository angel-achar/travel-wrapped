import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecommendationsPage from "@/app/recommendations/page";
import { getCountries, type Country } from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/recommendations",
}));

vi.mock("@/lib/api", () => ({
  getCountries: vi.fn(),
  loadSampleData: vi.fn(),
  errorMessage: (err: unknown) => (err instanceof Error ? err.message : "Something went wrong."),
}));

function country(name: string, continent: string, id: number): Country {
  return { id, name, continent, visited_date: null, cities: [], notes: "", trips: [] };
}

describe("RecommendationsPage", () => {
  it("promises a new-continent pick when there's a continent left to explore", async () => {
    vi.mocked(getCountries).mockResolvedValue([country("Japan", "Asia", 1)]);
    render(<RecommendationsPage />);
    expect(await screen.findByText(/plus one pick on a continent you haven't explored/)).toBeInTheDocument();
  });

  it("says so when every continent has been visited", async () => {
    vi.mocked(getCountries).mockResolvedValue([
      country("Morocco", "Africa", 1),
      country("Japan", "Asia", 2),
      country("France", "Europe", 3),
      country("Mexico", "North America", 4),
      country("Peru", "South America", 5),
      country("Australia", "Oceania", 6),
    ]);
    render(<RecommendationsPage />);
    expect(await screen.findByText(/You've been to every continent/)).toBeInTheDocument();
    expect(screen.queryByText(/continent you haven't explored/)).not.toBeInTheDocument();
  });
});
