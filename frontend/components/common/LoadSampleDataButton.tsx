"use client";

import { useState } from "react";
import { errorMessage, loadSampleData } from "@/lib/api";

type LoadSampleDataButtonProps = {
  // Called after the sample data is saved, so the page can reload its data.
  onLoaded: () => void;
};

export default function LoadSampleDataButton({ onLoaded }: LoadSampleDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsLoading(true);
    try {
      await loadSampleData();
      onLoaded();
    } catch (err) {
      setError(errorMessage(err, "Could not load sample data."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-full bg-pink-300 px-6 py-2.5 font-semibold text-purple-950 shadow-sm transition hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Loading sample data…" : "Load sample data"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
