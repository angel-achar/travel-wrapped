// Runs before every test file.
import "@testing-library/jest-dom/vitest"; // adds matchers like toBeInTheDocument()
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Remove whatever the last test rendered, so tests don't affect each other.
afterEach(() => {
  cleanup();
});
