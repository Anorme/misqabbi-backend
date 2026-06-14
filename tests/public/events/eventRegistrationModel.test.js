/*eslint-disable no-undef */
import { Types } from "mongoose";
import EventRegistration from "../../../src/models/eventRegistration.mongo.js";

describe("EventRegistration model", () => {
  it("stores guest attendee details and form responses", () => {
    const registration = new EventRegistration({
      event: new Types.ObjectId(),
      guestInfo: {
        name: "Ama",
        email: "AMA@EXAMPLE.COM",
        phone: "0240000000",
      },
      formResponses: {
        builtinFields: {
          name: "Ama",
          email: "ama@example.com",
        },
        customAnswers: {
          dietary: "vegetarian",
        },
      },
    });

    const validationError = registration.validateSync();

    expect(validationError).toBeUndefined();
    expect(registration.status).toBe("confirmed");
    expect(registration.guestInfo.email).toBe("ama@example.com");
    expect(registration.formResponses.customAnswers).toEqual({
      dietary: "vegetarian",
    });
  });

  it("stores paid ticket and transaction references", () => {
    const registration = new EventRegistration({
      event: new Types.ObjectId(),
      user: new Types.ObjectId(),
      ticketTypeId: new Types.ObjectId(),
      transaction: new Types.ObjectId(),
      status: "pending",
    });

    const validationError = registration.validateSync();

    expect(validationError).toBeUndefined();
    expect(registration.user).toBeDefined();
    expect(registration.ticketTypeId).toBeDefined();
    expect(registration.transaction).toBeDefined();
    expect(registration.status).toBe("pending");
  });

  it("rejects unsupported registration statuses", () => {
    const registration = new EventRegistration({
      event: new Types.ObjectId(),
      status: "archived",
    });

    const validationError = registration.validateSync();

    expect(validationError.errors.status.message).toContain(
      "`archived` is not a valid enum value"
    );
  });
});
