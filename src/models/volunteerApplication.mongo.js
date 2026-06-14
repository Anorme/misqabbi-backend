import { Schema, model } from "mongoose";

export const VOLUNTEER_APPLICATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
];

const applicantInfoSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const volunteerApplicationSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    applicantInfo: {
      type: applicantInfoSchema,
      default: () => ({}),
    },
    formResponses: {
      builtinFields: {
        type: Schema.Types.Mixed,
        default: {},
      },
      customAnswers: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    status: {
      type: String,
      enum: VOLUNTEER_APPLICATION_STATUSES,
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

volunteerApplicationSchema.index({ event: 1, status: 1, createdAt: -1 });

const VolunteerApplication = model(
  "VolunteerApplication",
  volunteerApplicationSchema
);

export default VolunteerApplication;
