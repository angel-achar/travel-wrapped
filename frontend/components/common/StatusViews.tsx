// The three "not ready yet" views every page uses:
//   LoadingState - while we wait for the backend
//   ErrorState   - when a request failed (with a "Try again" button)
//   EmptyState   - when there's no data yet (optionally with "Load sample data")

import LoadSampleDataButton from "@/components/common/LoadSampleDataButton";

export function LoadingState({ message }: { message: string }) {
  return (
    // role="status" + aria-live: screen readers announce this politely.
    <div role="status" aria-live="polite" className="mt-10 flex items-center gap-3 text-purple-700">
      {/* A small spinning circle. animate-spin is a Tailwind class. */}
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
      {message}
    </div>
  );
}

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6">
      <p className="font-semibold text-red-700">{title}</p>
      <p className="mt-1 text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

type EmptyStateProps = {
  emoji: string;
  title: string;
  message: string;
  // If given, we show a "Load sample data" button and call this after it works.
  onSampleLoaded?: () => void;
  // Any extra buttons or links (e.g. "Add a trip").
  children?: React.ReactNode;
};

export function EmptyState({ emoji, title, message, onSampleLoaded, children }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-purple-200 bg-white p-8 text-center">
      <p className="text-3xl">{emoji}</p>
      <p className="mt-2 text-lg font-semibold text-purple-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-purple-700">{message}</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {children}
        {onSampleLoaded && <LoadSampleDataButton onLoaded={onSampleLoaded} />}
      </div>
    </div>
  );
}
