import { describe, expect, it } from "vitest";
import { getViewer } from "./registry";

describe("viewers registry", () => {
  it("returns a component for each supported kind", () => {
    expect(getViewer("pdf")).toBeDefined();
    expect(getViewer("text")).toBeDefined();
    expect(getViewer("markdown")).toBeDefined();
    expect(getViewer("docx")).toBeDefined();
    expect(getViewer("xlsx")).toBeDefined();
  });
});
