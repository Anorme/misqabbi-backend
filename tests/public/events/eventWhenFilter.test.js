/*eslint-disable no-undef */
import {
  EVENT_WHEN_FILTERS,
  resolvePublicWhenFilter,
} from "../../../src/services/eventWhenLogic.js";

describe("eventWhenLogic", () => {
  it("defaults empty when to upcoming", () => {
    expect(resolvePublicWhenFilter(undefined)).toBe("upcoming");
    expect(resolvePublicWhenFilter("")).toBe("upcoming");
    expect(resolvePublicWhenFilter("  ")).toBe("upcoming");
  });

  it("accepts upcoming, past, and all", () => {
    expect(resolvePublicWhenFilter("upcoming")).toBe("upcoming");
    expect(resolvePublicWhenFilter("PAST")).toBe("past");
    expect(resolvePublicWhenFilter("All")).toBe("all");
  });

  it("rejects unknown when values", () => {
    expect(() => resolvePublicWhenFilter("tomorrow")).toThrow(
      "Invalid when filter. Use upcoming, past, or all"
    );
  });

  it("exposes the allowlist used by the public API", () => {
    expect([...EVENT_WHEN_FILTERS].sort()).toEqual(["all", "past", "upcoming"]);
  });
});
