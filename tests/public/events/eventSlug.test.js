/*eslint-disable no-undef */
import {
  buildEventSlug,
  buildEventSlugFamilyFilter,
  buildUniqueEventSlug,
  toRomanLower,
} from "../../../src/utils/eventSlug.js";

describe("eventSlug", () => {
  it("slugifies event names with hyphens", () => {
    expect(buildEventSlug("Her Health Circle")).toBe("her-health-circle");
    expect(buildEventSlug("  Her: Health & Circle!  ")).toBe(
      "her-health-and-circle"
    );
  });

  it("converts duplicate counts to lowercase Roman numeral suffixes", () => {
    expect(toRomanLower(2)).toBe("ii");
    expect(toRomanLower(3)).toBe("iii");
    expect(toRomanLower(4)).toBe("iv");
    expect(toRomanLower(9)).toBe("ix");
    expect(toRomanLower(12)).toBe("xii");
  });

  it("builds unique slugs from existing family counts", () => {
    expect(buildUniqueEventSlug("her-health-circle", 0)).toBe(
      "her-health-circle"
    );
    expect(buildUniqueEventSlug("her-health-circle", 1)).toBe(
      "her-health-circle-ii"
    );
    expect(buildUniqueEventSlug("her-health-circle", 2)).toBe(
      "her-health-circle-iii"
    );
  });

  it("builds a family filter for base and Roman-suffixed slugs", () => {
    const filter = buildEventSlugFamilyFilter("her-health-circle");

    expect(filter).toEqual({
      $or: [
        { slug: "her-health-circle" },
        { slug: { $regex: "^her-health-circle-[ivxlcdm]+$" } },
      ],
    });
  });
});
