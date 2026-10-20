"use client";

import { useState } from "react";
import CountryDatalist from "@/components/common/CountryDatalist";
import type { Trip, TripInput } from "@/lib/api";
import { validateTrip } from "@/lib/tripValidation";
import { findCountry } from "@/lib/worldCountries";

type TripFormProps = {
  // When editing, the form starts filled in with this trip.
  initialTrip?: Trip;
  submitLabel: string; // e.g. "Save trip"
  // The page does the saving. If it throws, we show the error message.
  onSubmit: (trip: TripInput) => Promise<void>;
  onCancel?: () => void;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-purple-200 bg-white px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200";
const labelClass = "block text-sm font-semibold text-purple-900";

export default function TripForm({ initialTrip, submitLabel, onSubmit, onCancel }: TripFormProps) {
  // Lists from the backend (e.g. ["Tokyo", "Kyoto"]) become "Tokyo, Kyoto" in the inputs.
  const [title, setTitle] = useState(initialTrip?.title ?? "");
  const [startDate, setStartDate] = useState(initialTrip?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialTrip?.end_date ?? "");
  const [countries, setCountries] = useState<string[]>(initialTrip?.countries ?? []);
  const [countryInput, setCountryInput] = useState("");
  const [cities, setCities] = useState(initialTrip?.cities.join(", ") ?? "");
  const [hotels, setHotels] = useState(initialTrip?.hotels.join(", ") ?? "");
  const [restaurants, setRestaurants] = useState(initialTrip?.restaurants.join(", ") ?? "");
  const [activities, setActivities] = useState(initialTrip?.activities.join(", ") ?? "");
  const [notes, setNotes] = useState(initialTrip?.notes ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adds whatever is typed in the country box to the list of chips.
  function addCountryFromInput() {
    const match = findCountry(countryInput);
    if (!match) {
      setError(`"${countryInput.trim()}" isn't in our list of 195 countries. Pick one from the suggestions.`);
      return;
    }
    if (!countries.includes(match.name)) {
      setCountries([...countries, match.name]);
    }
    setCountryInput("");
    setError(null);
  }

  function removeCountry(name: string) {
    setCountries(countries.filter((country) => country !== name));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // If they typed a country but forgot to press "Add", include it anyway.
    let finalCountries = countries;
    const typed = findCountry(countryInput);
    if (typed && !countries.includes(typed.name)) {
      finalCountries = [...countries, typed.name];
    }

    const trip: TripInput = {
      title: title.trim(),
      start_date: startDate,
      end_date: endDate,
      countries: finalCountries,
      cities,
      hotels,
      restaurants,
      activities,
      notes,
    };

    const problem = validateTrip(trip);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the trip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Trip form"
      className="space-y-5 rounded-3xl bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="trip-title" className={labelClass}>
          Title <span className="text-pink-600">*</span>
        </label>
        <input
          id="trip-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Spring in Japan"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="trip-start" className={labelClass}>
            Start date <span className="text-pink-600">*</span>
          </label>
          <input
            id="trip-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="trip-end" className={labelClass}>
            End date <span className="text-pink-600">*</span>
          </label>
          <input
            id="trip-end"
            type="date"
            value={endDate}
            // The date picker won't let you pick a day before the start date.
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="trip-country" className={labelClass}>
          Countries <span className="text-pink-600">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="trip-country"
            type="text"
            list="trip-country-options"
            autoComplete="off"
            value={countryInput}
            onChange={(event) => setCountryInput(event.target.value)}
            onKeyDown={(event) => {
              // Pressing Enter here adds the country instead of submitting the form.
              if (event.key === "Enter") {
                event.preventDefault();
                addCountryFromInput();
              }
            }}
            placeholder="Start typing, e.g. Italy"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addCountryFromInput}
            className="mt-1 rounded-xl bg-purple-700 px-4 font-semibold text-white transition hover:bg-purple-800"
          >
            Add
          </button>
        </div>
        <CountryDatalist id="trip-country-options" />

        {/* The chosen countries, each with a remove (×) button */}
        {countries.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Chosen countries">
            {countries.map((name) => (
              <li
                key={name}
                className="flex items-center gap-1 rounded-full bg-purple-100 py-1 pl-3 pr-1 text-sm font-semibold text-purple-800"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeCountry(name)}
                  aria-label={`Remove ${name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-purple-200"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="trip-cities" className={labelClass}>
          Cities (optional, separate with commas)
        </label>
        <input
          id="trip-cities"
          type="text"
          value={cities}
          onChange={(event) => setCities(event.target.value)}
          placeholder="e.g. Tokyo, Kyoto"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="trip-hotels" className={labelClass}>
            Hotels (optional)
          </label>
          <input
            id="trip-hotels"
            type="text"
            value={hotels}
            onChange={(event) => setHotels(event.target.value)}
            placeholder="Comma separated"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="trip-restaurants" className={labelClass}>
            Restaurants (optional)
          </label>
          <input
            id="trip-restaurants"
            type="text"
            value={restaurants}
            onChange={(event) => setRestaurants(event.target.value)}
            placeholder="Comma separated"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="trip-activities" className={labelClass}>
            Activities (optional)
          </label>
          <input
            id="trip-activities"
            type="text"
            value={activities}
            onChange={(event) => setActivities(event.target.value)}
            placeholder="Comma separated"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="trip-notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="trip-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      <p role="alert" aria-live="assertive" className="min-h-6 text-sm font-medium text-red-600">
        {error}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-pink-300 px-7 py-3 font-semibold text-purple-950 shadow transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-purple-200 px-7 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
