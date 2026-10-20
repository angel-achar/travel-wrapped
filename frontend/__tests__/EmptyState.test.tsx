import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/common/StatusViews";
import { loadSampleData } from "@/lib/api";

// Replace the real API call with a fake one, so no network is used.
vi.mock("@/lib/api", () => ({
  loadSampleData: vi.fn(),
  errorMessage: (err: unknown) => (err instanceof Error ? err.message : "Something went wrong."),
}));

describe("EmptyState", () => {
  it("shows a Load sample data button that loads data and tells the page", async () => {
    vi.mocked(loadSampleData).mockResolvedValue({ seeded: true, countries_added: 11, trips_added: 8 });
    const onSampleLoaded = vi.fn();

    render(<EmptyState emoji="🧳" title="No trips yet" message="Add one!" onSampleLoaded={onSampleLoaded} />);

    expect(screen.getByText("No trips yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load sample data" }));

    await waitFor(() => expect(onSampleLoaded).toHaveBeenCalledTimes(1));
    expect(loadSampleData).toHaveBeenCalledTimes(1);
  });

  it("shows an error if loading sample data fails", async () => {
    vi.mocked(loadSampleData).mockRejectedValue(new Error("Can't reach the server."));
    const onSampleLoaded = vi.fn();

    render(<EmptyState emoji="🧳" title="No trips yet" message="Add one!" onSampleLoaded={onSampleLoaded} />);
    fireEvent.click(screen.getByRole("button", { name: "Load sample data" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server.");
    expect(onSampleLoaded).not.toHaveBeenCalled();
  });

  it("hides the sample button when the page doesn't ask for it", () => {
    render(<EmptyState emoji="🧳" title="Nothing here" message="..." />);
    expect(screen.queryByRole("button", { name: "Load sample data" })).not.toBeInTheDocument();
  });
});
