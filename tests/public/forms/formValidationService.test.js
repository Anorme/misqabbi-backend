/*eslint-disable no-undef */
import { validateFormResponses } from "../../../src/services/formValidationService.js";

describe("formValidationService", () => {
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

  it("validates and normalizes configured builtin fields and custom answers", () => {
    const result = validateFormResponses(formSchema, {
      builtinFields: {
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
      normalizedResponses: {
        builtinFields: {
          name: "Ama",
          email: "ama@example.com",
          phone: "0240000000",
        },
        customAnswers: {
          dietary: "vegetarian",
          notes: "Seat near the front",
          consent: false,
        },
      },
    });
  });

  it("reports missing required builtin fields and custom questions", () => {
    const result = validateFormResponses(formSchema, {
      builtinFields: {
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

  it("rejects unknown builtin fields and custom answers", () => {
    const result = validateFormResponses(formSchema, {
      builtinFields: {
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
      expect.arrayContaining([
        "Unknown builtin field submitted: age",
        "Unknown custom question submitted: shirtSize",
      ])
    );
  });

  it("rejects select answers outside the configured options", () => {
    const result = validateFormResponses(formSchema, {
      builtinFields: {
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

  it("rejects invalid builtin field values", () => {
    const result = validateFormResponses(formSchema, {
      builtinFields: {
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
});
