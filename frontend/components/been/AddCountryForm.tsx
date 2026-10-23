"use client";

import { useState } from "react";
import CountryDatalist from "@/components/common/CountryDatalist";
import type { NewCountry } from "@/lib/api";
import { findCountry } from "@/lib/worldCountries";

type AddCountryFormProps = {
  // The parent page does the actual saving. If saving fails, this throws
  // an Error and we show its message under the form.
  onAdd: (country: NewCountry) => Promise<void>;
};

export default function AddCountryForm({ onAdd }: AddCountryFormProps) {
  // Each input is a "controlled" input: React state holds its value.
  const [name, setName] = useState("");
  const [visitedDate, setVisitedDate] = useState("");
  const [cities, setCities] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shows the continent as soon as the typed name matches a real country.
  const match = findCountry(name);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page (the default form behavior).
    event.preventDefault();

    // Validate before calling the backend (the backend checks again).
    if (name.trim() === "") {
      setError("Please enter a country name.");
      return;
    }
    if (!match) {
      setError(`"${name.trim()}" isn't in our list of 195 countries. Pick one from the suggestions.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onAdd({
        name: match.name, // the official spelling, e.g. "japan" -> "Japan"
        // Send undefined (left out of the JSON) instead of empty strings.
        visited_date: visitedDate || undefined,
        cities: cities.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      // Success: clear the form for the next country.
      setName("");
      setVisitedDate("");
      setCities("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add country.");
    } finally {
      // "finally" runs whether it worked or failed, so the button always
      // gets re-enabled.
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // we show our own validation message instead of the browser's
      className="space-y-4 rounded-3xl bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-purple-950">Add a country</h2>

      <div>
        <label htmlFor="country-name" className="block text-sm font-semibold text-purple-900">
          Country name <span className="text-pink-600">*</span>
        </label>
        <input
          id="country-name"
          type="text"
          list="been-country-options"
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Start typing, e.g. Japan"
          required
          aria-invalid={error !== null && !match}
          className="mt-1 w-full rounded-xl border border-purple-200 px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />
        <CountryDatalist id="been-country-options" />
        {match && <p className="mt-1 text-sm text-purple-600">Continent: {match.continent}</p>}
      </div>

      <div>
        <label htmlFor="visited-date" className="block text-sm font-semibold text-purple-900">
          Date visited (optional)
        </label>
        <input
          id="visited-date"
          type="date"
          value={visitedDate}
          onChange={(event) => setVisitedDate(event.target.value)}
          className="mt-1 w-full rounded-xl border border-purple-200 px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label htmlFor="cities" className="block text-sm font-semibold text-purple-900">
          Cities (optional, separate with commas)
        </label>
        <input
          id="cities"
          type="text"
          value={cities}
          onChange={(event) => setCities(event.target.value)}
          placeholder="e.g. Tokyo, Kyoto"
          className="mt-1 w-full rounded-xl border border-purple-200 px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label htmlFor="country-notes" className="block text-sm font-semibold text-purple-900">
          Notes (optional)
        </label>
        <textarea
          id="country-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Favorite food, a place to go back to, who you went with..."
          className="mt-1 w-full rounded-xl border border-purple-200 px-4 py-2 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />
      </div>

      {/* aria-live makes screen readers announce the message when it appears. */}
      <p role="alert" aria-live="assertive" className="min-h-6 text-sm font-medium text-red-600">
        {error}
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-pink-300 px-7 py-3 font-semibold text-purple-950 shadow transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Adding…" : "Add country"}
      </button>
    </form>
  );
}
