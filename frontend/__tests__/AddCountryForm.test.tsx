import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddCountryForm from "@/components/been/AddCountryForm";

describe("AddCountryForm", () => {
  it("shows the continent once the name matches a real country", () => {
    render(<AddCountryForm onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/country name/i), { target: { value: "peru" } });
    expect(screen.getByText("Continent: South America")).toBeInTheDocument();
  });

  it("won't add a country that isn't in the list", () => {
    const onAdd = vi.fn();
    render(<AddCountryForm onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText(/country name/i), { target: { value: "Hawaii" } });
    fireEvent.click(screen.getByRole("button", { name: "Add country" }));

    expect(screen.getByRole("alert")).toHaveTextContent("isn't in our list of 195 countries");
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("sends the official spelling and shows backend errors", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("You already added Japan."));
    render(<AddCountryForm onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText(/country name/i), { target: { value: "japan" } });
    fireEvent.click(screen.getByRole("button", { name: "Add country" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Japan", visited_date: undefined, cities: undefined }));
    expect(await screen.findByText("You already added Japan.")).toBeInTheDocument();
  });
});
