import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

// Next.js shows this page for any URL that doesn't match a route.
export default function NotFound() {
  return (
    <PageLayout title="Page not found">
      <div className="mt-8 rounded-3xl border-2 border-dashed border-purple-200 bg-white p-10 text-center">
        <p className="text-5xl">🗺️</p>
        <p className="mt-4 text-xl font-semibold text-purple-900">
          Looks like this page went off the map.
        </p>
        <p className="mt-2 text-purple-700">The link may be broken, or the page may have moved.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-pink-300 px-6 py-2.5 font-semibold text-purple-950 transition hover:bg-pink-200"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-purple-200 px-6 py-2.5 font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
