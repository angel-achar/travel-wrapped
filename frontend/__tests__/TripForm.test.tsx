import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TripForm from "@/components/trips/TripForm";

// Small helper: type into the input with this label.
function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("TripForm", () => {
  it("blocks saving when the end date is before the start date", async () => {
    const onSubmit = vi.fn();
    render(<TripForm submitLabel="Save trip" onSubmit={onSubmit} />);

    type(/title/i, "Spring in Japan");
    type(/start date/i, "2025-03-24");
    type(/end date/i, "2025-03-14");
    type(/^countries/i, "Japan");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(await screen.findByText("End date can't be before the start date.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a title", async () => {
    const onSubmit = vi.fn();
    render(<TripForm submitLabel="Save trip" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(await screen.findByText("Please give your trip a title.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a country that isn't in the list", () => {
    render(<TripForm submitLabel="Save trip" onSubmit={vi.fn()} />);

    type(/^countries/i, "Atlantis");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("alert")).toHaveTextContent("isn't in our list of 195 countries");
  });

  it("sends a valid trip, using the official country spelling", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TripForm submitLabel="Save trip" onSubmit={onSubmit} />);

    type(/title/i, "  Europe Summer ");
    type(/start date/i, "2024-06-10");
    type(/end date/i, "2024-06-24");
    type(/^countries/i, "france");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    type(/^countries/i, "Italy"); // typed but not "Add"-ed: still included
    type(/cities/i, "Paris, Rome");
    fireEvent.click(screen.getByRole("button", { name: "Save trip" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const sent = onSubmit.mock.calls[0][0];
    expect(sent.title).toBe("Europe Summer");
    expect(sent.countries).toEqual(["France", "Italy"]);
    expect(sent.cities).toBe("Paris, Rome");
  });
});
