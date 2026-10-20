// All calls to the FastAPI backend go through this one file.
// Components never call fetch() directly; they call these functions instead.

import { getWorkspaceId } from "@/lib/workspace";

// ---------- Types (these match the Pydantic models in backend/main.py) ----------

export type Country = {
  id: number;
  name: string;
  continent: string; // e.g. "Asia" ("Unknown" for old rows not in the list)
  visited_date: string | null; // "YYYY-MM-DD", or null if not given
  cities: string[];
};

// What we send when adding a country. Only name is required.
export type NewCountry = {
  name: string;
  visited_date?: string;
  cities?: string; // comma-separated, e.g. "Tokyo, Kyoto"
};

export type ContinentCount = {
  continent: string;
  countries: number;
};

export type Stats = {
  countries_visited: number;
  total_countries: number;
  percent_of_world: number;
  cities_visited: number;
  continents_visited: number;
  by_continent: ContinentCount[];
  top_continent: string | null;
  total_trips: number;
  total_trip_days: number;
};

export type Trip = {
  id: number;
  title: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;
  days: number; // counts both the first and last day
  countries: string[];
  continents: string[];
  cities: string[];
  hotels: string[];
  restaurants: string[];
  activities: string[];
  notes: string;
};

// What we send when creating or editing a trip.
export type TripInput = {
  title: string;
  start_date: string;
  end_date: string;
  countries: string[];
  cities: string; // comma-separated
  hotels: string;
  restaurants: string;
  activities: string;
  notes: string;
};

export type Wrapped = {
  year: number;
  available_years: number[];
  trips_taken: number;
  days_traveled: number;
  countries: string[];
  continents: string[];
  cities: string[];
  top_destination: string | null;
  longest_trip: { id: number; title: string; days: number } | null;
  personality: string;
  personality_reason: string;
};

export type SeedResult = {
  seeded: boolean; // false if the workspace already had data
  countries_added: number;
  trips_added: number;
};

// An Error that also remembers the HTTP status code, so a page can tell
// "not found" (404) apart from other problems.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// NEXT_PUBLIC_ variables are readable in the browser. If it isn't set,
// fall back to the local backend.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------- Shared helper ----------

// Sends a request and returns the parsed JSON. <T> is the type we expect back,
// e.g. request<Country[]>(...) returns a Country[].
// If anything goes wrong, it throws an Error with a message we can show the user.
async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  // Every request says which workspace it's for, so the backend only
  // reads and changes this browser's data.
  const headers: Record<string, string> = { "X-Workspace-Id": getWorkspaceId() };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch() itself only fails when the server can't be reached at all.
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }

  if (!response.ok) {
    // The backend sends errors like { "detail": "You already added Japan." }
    let message = `Something went wrong (error ${response.status}).`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody.detail === "string") {
        message = errorBody.detail;
      }
    } catch {
      // The error body wasn't JSON, so keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  // 204 means "success, no content" (what DELETE returns), so there's no JSON.
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// Turns any caught error into a message we can show on screen.
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  return err instanceof Error ? err.message : fallback;
}

// ---------- Countries ----------

export function getCountries(): Promise<Country[]> {
  return request<Country[]>("/api/countries");
}

export function addCountry(country: NewCountry): Promise<Country> {
  return request<Country>("/api/countries", "POST", country);
}

export function deleteCountry(id: number): Promise<void> {
  return request<void>(`/api/countries/${id}`, "DELETE");
}

// ---------- Trips ----------

export function getTrips(): Promise<Trip[]> {
  return request<Trip[]>("/api/trips");
}

export function getTrip(id: number): Promise<Trip> {
  return request<Trip>(`/api/trips/${id}`);
}

export function createTrip(trip: TripInput): Promise<Trip> {
  return request<Trip>("/api/trips", "POST", trip);
}

export function updateTrip(id: number, trip: TripInput): Promise<Trip> {
  return request<Trip>(`/api/trips/${id}`, "PUT", trip);
}

export function deleteTrip(id: number): Promise<void> {
  return request<void>(`/api/trips/${id}`, "DELETE");
}

// ---------- Insights ----------

export function getStats(): Promise<Stats> {
  return request<Stats>("/api/stats");
}

// Leave out the year to get the most recent year that has trips.
export function getWrapped(year?: number): Promise<Wrapped> {
  const query = year === undefined ? "" : `?year=${year}`;
  return request<Wrapped>(`/api/wrapped${query}`);
}

// ---------- Workspace ----------

export function loadSampleData(): Promise<SeedResult> {
  return request<SeedResult>("/api/sample-data", "POST");
}

export function clearWorkspace(): Promise<void> {
  return request<void>("/api/workspace", "DELETE");
}
