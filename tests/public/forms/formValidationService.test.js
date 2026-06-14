/*eslint-disable no-undef */
import {
  validateFormResponses,
  validateFormSubmission,
} from "../../../src/services/formValidationLogic.js";

describe("formValidationLogic", () => {
  const formSchema = {
    builtinFields: [
      { field: "name", required: true },
      { field: "email", required: true },
      { field: "phone", required: false },
    ],
    customQuestions: [
      {
        id: "dietary",
        label: "Dietary preference",
        type: "select",
        required: true,
        options: ["none", "vegetarian"],
      },
      {
        id: "notes",
        label: "Additional notes",
        type: "textarea",
        required: false,
      },
      {
        id: "consent",
        label: "Can we contact you?",
        type: "checkbox",
        required: true,
      },
    ],
  };

  it("validates and normalizes configured identity fields and custom answers", () => {
    const result = validateFormSubmission(formSchema, {
      identity: {
        name: "  Ama  ",
        email: "ama@example.com",
        phone: "  0240000000  ",
      },
      customAnswers: {
        dietary: "vegetarian",
        notes: "  Seat near the front  ",
        consent: false,
      },
    });

    expect(result).toEqual({
      valid: true,
      errors: [],
      normalizedIdentity: {
        name: "Ama",
        email: "ama@example.com",
        phone: "0240000000",
      },
      normalizedCustomAnswers: {
        dietary: "vegetarian",
        notes: "Seat near the front",
        consent: false,
      },
    });
  });

  it("reports missing required identity fields and custom questions", () => {
    const result = validateFormSubmission(formSchema, {
      identity: {
        phone: "0240000000",
      },
      customAnswers: {},
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "name is required",
        "email is required",
        "Dietary preference is required",
        "Can we contact you? is required",
      ])
    );
  });

  it("rejects unknown custom answers", () => {
    const result = validateFormSubmission(formSchema, {
      identity: {
        name: "Ama",
        email: "ama@example.com",
        age: 34,
      },
      customAnswers: {
        dietary: "none",
        consent: true,
        shirtSize: "M",
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining(["Unknown custom question submitted: shirtSize"])
    );
    expect(result.errors).not.toContain("Unknown builtin field submitted: age");
  });

  it("rejects select answers outside the configured options", () => {
    const result = validateFormSubmission(formSchema, {
      identity: {
        name: "Ama",
        email: "ama@example.com",
      },
      customAnswers: {
        dietary: "vegan",
        consent: true,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Dietary preference must match one of the configured options"
    );
  });

  it("rejects invalid configured identity field values", () => {
    const result = validateFormSubmission(formSchema, {
      identity: {
        name: "Ama",
        email: "not-an-email",
      },
      customAnswers: {
        dietary: "none",
        consent: true,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("email is invalid");
  });

  it("uses a resolved email when validating logged-in registrations", () => {
    const result = validateFormSubmission(formSchema, {
      identity: {
        name: "Ama",
      },
      resolvedEmail: "account@example.com",
      customAnswers: {
        dietary: "none",
        consent: true,
      },
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedIdentity).toEqual({
      name: "Ama",
      email: "account@example.com",
    });
  });

  it("rejects legacy builtin field response submissions", () => {
    const result = validateFormResponses(formSchema, {
      builtinFields: {
        name: "Ama",
        email: "ama@example.com",
      },
      customAnswers: {
        dietary: "none",
        consent: true,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "formResponses.builtinFields is no longer supported"
    );
  });

  it("validates the same registration form schema for free and paid event responses", () => {
    const registrationForm = {
      builtinFields: [
        { field: "name", required: true },
        { field: "email", required: true },
      ],
      customQuestions: [
        {
          id: "attendanceReason",
          label: "Why are you attending?",
          type: "text",
          required: true,
        },
      ],
    };

    const freeEventResponse = validateFormSubmission(registrationForm, {
      identity: {
        name: "Ama",
        email: "ama@example.com",
      },
      customAnswers: {
        attendanceReason: "To learn",
      },
    });
    const paidEventResponse = validateFormSubmission(registrationForm, {
      identity: {
        name: "Kojo",
        email: "kojo@example.com",
      },
      customAnswers: {
        attendanceReason: "Networking",
      },
    });

    expect(freeEventResponse.valid).toBe(true);
    expect(paidEventResponse.valid).toBe(true);
  });
});
