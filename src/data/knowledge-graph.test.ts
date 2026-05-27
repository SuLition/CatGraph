import { describe, it, expect } from "vitest";
import { TYPE_TOKENS } from "./knowledge-graph";

describe("knowledge-graph", () => {
  it("defines a token for every node type", () => {
    const types = ["experiment", "constant", "result", "equipment", "reference"] as const;
    for (const t of types) {
      expect(TYPE_TOKENS[t]).toBeDefined();
      expect(TYPE_TOKENS[t].hue).toBeTypeOf("number");
      expect(TYPE_TOKENS[t].label).toBeTypeOf("string");
    }
  });
});
