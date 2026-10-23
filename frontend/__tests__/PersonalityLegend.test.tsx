import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PersonalityLegend, { PERSONALITIES } from "@/components/wrapped/PersonalityLegend";

describe("PersonalityLegend", () => {
  it("lists every personality with its rule and marks the current one", () => {
    render(<PersonalityLegend current="Globetrotter" />);

    for (const p of PERSONALITIES) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
      expect(screen.getByText(p.rule)).toBeInTheDocument();
    }
    const yours = screen.getByText("You").closest("li");
    expect(yours).toHaveAttribute("aria-current", "true");
    expect(yours).toHaveTextContent("Globetrotter");
  });
});
