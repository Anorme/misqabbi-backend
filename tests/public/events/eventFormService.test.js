/*eslint-disable no-undef */
import {
  assertEventSupportsRegistrationForm,
  getLinkedFormId,
  hasLinkedForm,
} from "../../../src/services/eventFormService.js";

describe("eventFormService", () => {
  it("allows registration forms for free and paid events", () => {
    expect(() =>
      assertEventSupportsRegistrationForm({ type: "free" })
    ).not.toThrow();
    expect(() =>
      assertEventSupportsRegistrationForm({ type: "paid" })
    ).not.toThrow();
  });

  it("throws when the event is missing", () => {
    expect(() => assertEventSupportsRegistrationForm(null)).toThrow(
      "Event not found"
    );
  });

  it("extracts linked form IDs from object or string references", () => {
    const objectId = {
      toString: () => "64a000000000000000000001",
    };

    expect(
      getLinkedFormId({ registrationFormId: { _id: objectId } })
    ).toBe("64a000000000000000000001");
    expect(
      getLinkedFormId({ registrationFormId: "64a000000000000000000002" })
    ).toBe("64a000000000000000000002");
    expect(
      getLinkedFormId(
        { volunteerFormId: "64a000000000000000000003" },
        "volunteerFormId"
      )
    ).toBe("64a000000000000000000003");
  });

  it("reports whether an event already has a linked form", () => {
    expect(
      hasLinkedForm({ registrationFormId: "64a000000000000000000002" })
    ).toBe(true);
    expect(
      hasLinkedForm(
        { volunteerFormId: "64a000000000000000000003" },
        "volunteerFormId"
      )
    ).toBe(true);
    expect(hasLinkedForm({ registrationFormId: null })).toBe(false);
  });
});
