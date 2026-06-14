import { Schema, model } from "mongoose";

export const EVENT_REGISTRATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
];

const guestInfoSchema = new Schema(
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

const eventRegistrationSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestInfo: {
      type: guestInfoSchema,
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
    ticketTypeId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: EVENT_REGISTRATION_STATUSES,
      default: "confirmed",
      index: true,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ event: 1, status: 1, createdAt: -1 });
eventRegistrationSchema.index({ event: 1, ticketTypeId: 1, status: 1 });

const EventRegistration = model("EventRegistration", eventRegistrationSchema);

export default EventRegistration;
