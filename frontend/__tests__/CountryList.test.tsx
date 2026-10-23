import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CountryList from "@/components/been/CountryList";
import type { Country } from "@/lib/api";

const japan: Country = {
  id: 1,
  name: "Japan",
  continent: "Asia",
  visited_date: "2025-03-14",
  cities: ["Tokyo", "Kyoto"],
  notes: "Go back for cherry blossoms.",
  trips: [
    { id: 7, title: "Spring in Japan", start_date: "2025-03-14" },
    { id: 3, title: "Tokyo weekend", start_date: "2024-06-01" },
  ],
};

describe("CountryList", () => {
  it("shows a country's notes and links to its trips", () => {
    render(<CountryList countries={[japan]} deletingId={null} onDelete={() => {}} onSave={async () => {}} />);

    expect(screen.getByText(/Go back for cherry blossoms/)).toBeInTheDocument();
    expect(screen.getByText(/2 trips:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spring in Japan" })).toHaveAttribute("href", "/trips/7");
    expect(screen.getByRole("link", { name: "Tokyo weekend" })).toHaveAttribute("href", "/trips/3");
  });

  it("edits the notes and saves them", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CountryList countries={[japan]} deletingId={null} onDelete={() => {}} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Japan" }));
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "  Try the ramen.  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(1, { visited_date: "2025-03-14", cities: "Tokyo, Kyoto", notes: "Try the ramen." }),
    );
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument());
  });

  it("keeps the form open and shows the error if saving fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Can't reach the server."));
    render(<CountryList countries={[japan]} deletingId={null} onDelete={() => {}} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Japan" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server.");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
