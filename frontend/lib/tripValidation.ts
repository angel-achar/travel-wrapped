// Checks a trip before we send it to the backend. The backend runs the same
// checks again (never trust the browser alone), but checking here first
// gives the user instant feedback.

import type { TripInput } from "@/lib/api";
import { findCountry } from "@/lib/worldCountries";

// Returns an error message, or null if the trip looks good.
export function validateTrip(trip: TripInput): string | null {
  if (trip.title.trim() === "") {
    return "Please give your trip a title.";
  }
  if (trip.title.trim().length > 100) {
    return "Trip title must be 100 characters or less.";
  }
  if (trip.start_date === "" || trip.end_date === "") {
    return "Please pick a start date and an end date.";
  }
  // "YYYY-MM-DD" strings compare correctly as plain text.
  if (trip.end_date < trip.start_date) {
    return "End date can't be before the start date.";
  }
  if (trip.countries.length === 0) {
    return "Add at least one country.";
  }
  for (const name of trip.countries) {
    if (!findCountry(name)) {
      return `"${name}" isn't in our list of 195 countries.`;
    }
  }
  return null;
}
