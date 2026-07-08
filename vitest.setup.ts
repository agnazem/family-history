// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees between tests so component tests don't leak into each other.
afterEach(() => {
  cleanup();
});
