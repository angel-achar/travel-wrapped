"use client";

import Link from "next/link";
import { useState } from "react";
import type { Country, CountryChanges } from "@/lib/api";

type CountryListProps = {
  countries: Country[];
  // The id of the country currently being deleted, or null if none.
  deletingId: number | null;
  onDelete: (id: number) => void;
  // Saves edits to a country. Throws an Error with a message if it fails.
  onSave: (id: number, changes: CountryChanges) => Promise<void>;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-purple-200 px-3 py-1.5 text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200";

export default function CountryList({ countries, deletingId, onDelete, onSave }: CountryListProps) {
  // The page shows its own "no countries yet" state when the whole list is
  // empty, so if we get here with nothing it's because of the filters.
  if (countries.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-white p-8 text-center">
        <p className="font-semibold text-purple-900">No countries match your filters.</p>
        <p className="mt-1 text-purple-700">Try a different search or continent.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {countries.map((country) => (
        // "key" helps React track which item is which when the list changes.
        <CountryCard
          key={country.id}
          country={country}
          deleting={deletingId === country.id}
          onDelete={onDelete}
          onSave={onSave}
        />
      ))}
    </ul>
  );
}

type CountryCardProps = {
  country: Country;
  deleting: boolean;
  onDelete: (id: number) => void;
  onSave: (id: number, changes: CountryChanges) => Promise<void>;
};

// One country on the Been page. Shows its date, cities, notes, and the trips
// that went there, and can switch into an edit form.
function CountryCard({ country, deleting, onDelete, onSave }: CountryCardProps) {
  const [editing, setEditing] = useState(false);
  const [visitedDate, setVisitedDate] = useState(country.visited_date ?? "");
  const [cities, setCities] = useState(country.cities.join(", "));
  const [notes, setNotes] = useState(country.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    // Start from the saved values every time the form opens.
    setVisitedDate(country.visited_date ?? "");
    setCities(country.cities.join(", "));
    setNotes(country.notes);
    setError(null);
    setEditing(true);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(country.id, {
        visited_date: visitedDate || undefined,
        cities: cities.trim(),
        notes: notes.trim(),
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-purple-950">{country.name}</p>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              {country.continent}
            </span>
          </div>

          {!editing && (
            <>
              {country.visited_date && <p className="text-sm text-purple-700">Visited {country.visited_date}</p>}
              {country.cities.length > 0 && (
                <p className="mt-1 text-sm text-slate-600">📍 {country.cities.join(", ")}</p>
              )}
              {country.notes && (
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">📝 {country.notes}</p>
              )}
              {country.trips.length > 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  🧳 {country.trips.length === 1 ? "Trip:" : `${country.trips.length} trips:`}{" "}
                  {country.trips.map((trip, i) => (
                    <span key={trip.id}>
                      {i > 0 && ", "}
                      <Link href={`/trips/${trip.id}`} className="font-semibold text-purple-700 underline-offset-2 hover:underline">
                        {trip.title}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={startEditing}
              aria-label={`Edit ${country.name}`}
              className="rounded-full border border-purple-200 px-4 py-1.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(country.id)}
              disabled={deleting}
              // aria-label gives screen readers the full context ("Remove Japan").
              aria-label={`Remove ${country.name}`}
              className="rounded-full border border-purple-200 px-4 py-1.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Removing…" : "Remove"}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mt-3 space-y-3">
          <div>
            <label htmlFor={`date-${country.id}`} className="block text-sm font-semibold text-purple-900">
              Date visited
            </label>
            <input
              id={`date-${country.id}`}
              type="date"
              value={visitedDate}
              onChange={(event) => setVisitedDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`cities-${country.id}`} className="block text-sm font-semibold text-purple-900">
              Cities (separate with commas)
            </label>
            <input
              id={`cities-${country.id}`}
              type="text"
              value={cities}
              onChange={(event) => setCities(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`notes-${country.id}`} className="block text-sm font-semibold text-purple-900">
              Notes
            </label>
            <textarea
              id={`notes-${country.id}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
          <p role="alert" aria-live="assertive" className="text-sm font-medium text-red-600">
            {error}
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-pink-300 px-5 py-1.5 text-sm font-semibold text-purple-950 transition hover:bg-pink-200 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-purple-200 px-5 py-1.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
