import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

// The project plan lists /login, but real accounts aren't built yet.
// Instead of a fake sign-in form, this page explains how data is saved today.
// (It's intentionally not in the navbar.)
export default function LoginPage() {
  return (
    <PageLayout title="Accounts are coming soon">
      <div className="mt-8 max-w-2xl space-y-4 rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-purple-900">
          Travel Wrapped doesn&apos;t have sign-in yet. For now, your countries and trips are saved
          in a private <strong>workspace</strong> tied to this browser. Other visitors can&apos;t see
          or change them.
        </p>
        <p className="text-purple-700">
          If you clear your browser data or switch browsers, you&apos;ll start with a fresh, empty
          workspace.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-full bg-pink-300 px-6 py-2.5 font-semibold text-purple-950 transition hover:bg-pink-200"
        >
          Go to your dashboard
        </Link>
      </div>
    </PageLayout>
  );
}
