"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import TripForm from "@/components/trips/TripForm";
import { createTrip, type TripInput } from "@/lib/api";

export default function NewTripPage() {
  const router = useRouter();

  // If createTrip throws, TripForm catches it and shows the message.
  async function handleCreate(trip: TripInput) {
    const saved = await createTrip(trip);
    // Go to the new trip's details page.
    router.push(`/trips/${saved.id}`);
  }

  return (
    <PageLayout
      title="New trip"
      subtitle="Fields marked * are required. Countries you add here are also added to your Been list."
    >
      <Link href="/trips" className="mt-4 inline-block font-semibold text-purple-700 hover:underline">
        ← Back to trips
      </Link>
      <div className="mt-4 max-w-3xl">
        <TripForm submitLabel="Save trip" onSubmit={handleCreate} onCancel={() => router.push("/trips")} />
      </div>
    </PageLayout>
  );
}
