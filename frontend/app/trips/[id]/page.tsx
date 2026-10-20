"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { ErrorState, LoadingState } from "@/components/common/StatusViews";
import TripForm from "@/components/trips/TripForm";
import { ApiError, deleteTrip, errorMessage, getTrip, updateTrip, type Trip, type TripInput } from "@/lib/api";

// "notfound" is its own state so we can show a friendly 404 message.
type Status = "loading" | "error" | "notfound" | "ready";

export default function TripDetailsPage() {
  const router = useRouter();
  // The [id] in the folder name becomes params.id, e.g. "/trips/12" -> "12".
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  // Something like /trips/abc can't be a real trip.
  const isBadId = !Number.isInteger(tripId) || tripId <= 0;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isBadId) return; // nothing to fetch
    getTrip(tripId)
      .then((data) => {
        setTrip(data);
        setStatus("ready");
      })
      .catch((err) => {
        // 404 means no trip with this id in YOUR workspace.
        if (err instanceof ApiError && err.status === 404) {
          setStatus("notfound");
        } else {
          setLoadError(errorMessage(err));
          setStatus("error");
        }
      });
  }, [tripId, isBadId, reloadKey]);

  function handleRetry() {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }

  // If updateTrip throws, TripForm shows the message.
  async function handleSave(input: TripInput) {
    const updated = await updateTrip(tripId, input);
    setTrip(updated);
    setIsEditing(false);
  }

  async function handleDelete() {
    // window.confirm shows the browser's built-in "OK / Cancel" box.
    if (!trip || !window.confirm(`Delete "${trip.title}"? This can't be undone.`)) {
      return;
    }
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteTrip(tripId);
      router.push("/trips");
    } catch (err) {
      setDeleteError(errorMessage(err, "Could not delete the trip."));
      setIsDeleting(false);
    }
  }

  const backLink = (
    <Link href="/trips" className="mt-4 inline-block font-semibold text-purple-700 hover:underline">
      ← Back to trips
    </Link>
  );

  // 404 state (bad id, deleted trip, or a trip from another browser's workspace).
  if (isBadId || status === "notfound") {
    return (
      <PageLayout title="Trip not found">
        <div className="mt-8 rounded-3xl border-2 border-dashed border-purple-200 bg-white p-8 text-center">
          <p className="text-3xl">🧭</p>
          <p className="mt-2 text-lg font-semibold text-purple-900">We couldn&apos;t find that trip.</p>
          <p className="mx-auto mt-1 max-w-md text-purple-700">
            It may have been deleted, or it belongs to a different workspace (each browser has its own).
          </p>
          <Link
            href="/trips"
            className="mt-5 inline-block rounded-full bg-pink-300 px-6 py-2.5 font-semibold text-purple-950 transition hover:bg-pink-200"
          >
            See your trips
          </Link>
        </div>
      </PageLayout>
    );
  }

  if (status === "loading") {
    return (
      <PageLayout title="Trip details">
        <LoadingState message="Loading trip…" />
      </PageLayout>
    );
  }

  if (status === "error" || !trip) {
    return (
      <PageLayout title="Trip details">
        <ErrorState title="We couldn't load this trip." message={loadError} onRetry={handleRetry} />
      </PageLayout>
    );
  }

  if (isEditing) {
    return (
      <PageLayout title="Edit trip">
        <div className="mt-6 max-w-3xl">
          <TripForm
            initialTrip={trip}
            submitLabel="Save changes"
            onSubmit={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </PageLayout>
    );
  }

  const actions = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-full bg-purple-700 px-6 py-2.5 font-semibold text-white transition hover:bg-purple-800"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-full border border-red-200 bg-white px-6 py-2.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );

  return (
    <PageLayout title={trip.title} subtitle={`${trip.start_date} → ${trip.end_date}`} actions={actions}>
      {backLink}

      {deleteError && (
        <p role="alert" className="mt-4 font-medium text-red-600">
          {deleteError}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fact label="Days" value={String(trip.days)} />
        <Fact label="Countries" value={String(trip.countries.length)} />
        <Fact label="Cities" value={String(trip.cities.length)} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <DetailList title="🌍 Countries" items={trip.countries} extra={trip.continents.join(", ")} />
        <DetailList title="📍 Cities" items={trip.cities} />
        <DetailList title="🏨 Hotels" items={trip.hotels} />
        <DetailList title="🍜 Restaurants" items={trip.restaurants} />
        <DetailList title="🎟️ Activities" items={trip.activities} />

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">📝 Notes</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{trip.notes || "No notes."}</p>
        </section>
      </div>
    </PageLayout>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-purple-100 p-5 shadow-sm">
      <p className="text-3xl font-bold text-purple-700">{value}</p>
      <p className="mt-1 text-purple-900">{label}</p>
    </div>
  );
}

type DetailListProps = {
  title: string;
  items: string[];
  extra?: string; // a small line under the title, e.g. the continents
};

function DetailList({ title, items, extra }: DetailListProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      {extra && <p className="text-sm text-purple-600">{extra}</p>}
      {items.length === 0 ? (
        <p className="mt-2 text-slate-500">None added.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-900">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
