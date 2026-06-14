/*eslint-disable no-undef */
import { Types } from "mongoose";
import VolunteerApplication from "../../../src/models/volunteerApplication.mongo.js";

describe("VolunteerApplication model", () => {
  it("stores applicant info, form responses, and pending status by default", () => {
    const application = new VolunteerApplication({
      event: new Types.ObjectId(),
      applicantInfo: {
        name: "Ama",
        email: "AMA@EXAMPLE.COM",
        phone: "0240000000",
      },
      formResponses: {
        customAnswers: {
          availability: "Weekends",
          hasExperience: true,
        },
      },
    });

    const validationError = application.validateSync();

    expect(validationError).toBeUndefined();
    expect(application.status).toBe("pending");
    expect(application.applicantInfo.email).toBe("ama@example.com");
    expect(application.formResponses.builtinFields).toBeUndefined();
    expect(application.formResponses.customAnswers).toEqual({
      availability: "Weekends",
      hasExperience: true,
    });
  });

  it("rejects unsupported statuses", () => {
    const application = new VolunteerApplication({
      event: new Types.ObjectId(),
      status: "archived",
    });

    const validationError = application.validateSync();

    expect(validationError.errors.status.message).toContain(
      "`archived` is not a valid enum value"
    );
  });
});
