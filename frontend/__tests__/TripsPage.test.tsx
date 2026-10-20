import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TripsPage from "@/app/trips/page";
import { getTrips, type Trip } from "@/lib/api";

// The navbar asks Next.js for the current URL; give it a fake one.
vi.mock("next/navigation", () => ({
  usePathname: () => "/trips",
}));

vi.mock("@/lib/api", () => ({
  getTrips: vi.fn(),
  loadSampleData: vi.fn(),
  errorMessage: (err: unknown) => (err instanceof Error ? err.message : "Something went wrong."),
}));

function makeTrip(id: number, title: string, country: string, continent: string, start: string): Trip {
  return {
    id,
    title,
    start_date: start,
    end_date: start,
    days: 1,
    countries: [country],
    continents: [continent],
    cities: [],
    hotels: [],
    restaurants: [],
    activities: [],
    notes: "",
  };
}

const TRIPS = [
  makeTrip(1, "Spring in Japan", "Japan", "Asia", "2025-03-14"),
  makeTrip(2, "Europe Summer", "France", "Europe", "2024-06-10"),
  makeTrip(3, "Inca Trail", "Peru", "South America", "2024-03-22"),
];

describe("Trips page", () => {
  it("shows a loading state, then the trips", async () => {
    vi.mocked(getTrips).mockResolvedValue(TRIPS);
    render(<TripsPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading your trips");
    expect(await screen.findByText("Spring in Japan")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3 trips")).toBeInTheDocument();
  });

  it("narrows the list with the continent filter and the search box", async () => {
    vi.mocked(getTrips).mockResolvedValue(TRIPS);
    render(<TripsPage />);
    await screen.findByText("Spring in Japan");

    fireEvent.change(screen.getByLabelText("Continent"), { target: { value: "Europe" } });
    expect(screen.getByText("Showing 1 of 3 trips")).toBeInTheDocument();
    expect(screen.getByText("Europe Summer")).toBeInTheDocument();
    expect(screen.queryByText("Spring in Japan")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Continent"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "peru" } });
    expect(screen.getByText("Showing 1 of 3 trips")).toBeInTheDocument();
    expect(screen.getByText("Inca Trail")).toBeInTheDocument();
  });

  it("shows the empty state with a Load sample data button", async () => {
    vi.mocked(getTrips).mockResolvedValue([]);
    render(<TripsPage />);

    expect(await screen.findByText("No trips yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load sample data" })).toBeInTheDocument();
  });

  it("shows an error state with Try again", async () => {
    vi.mocked(getTrips).mockRejectedValue(new Error("Can't reach the server."));
    render(<TripsPage />);

    expect(await screen.findByText("Can't reach the server.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
