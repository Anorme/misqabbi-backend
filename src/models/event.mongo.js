import { Schema, model } from "mongoose";

export const EVENT_TYPES = ["free", "paid"];
export const EVENT_STATUSES = ["draft", "published", "cancelled"];

const eventAssetSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const eventVenueSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const ticketTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pricePesewas: {
      type: Number,
      required: true,
      min: 1,
    },
    maxQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    soldCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    expirySource: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const eventSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: "draft",
      index: true,
    },
    maxAttendees: {
      type: Number,
      required: true,
      min: 1,
    },
    venue: {
      type: eventVenueSchema,
      default: undefined,
    },
    banner: {
      type: eventAssetSchema,
      default: undefined,
    },
    ticketTypes: {
      type: [ticketTypeSchema],
      default: [],
    },
    registrationFormId: {
      type: Schema.Types.ObjectId,
      ref: "FormSchema",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, type: 1, eventDate: 1 });
eventSchema.index(
  { name: "text", description: "text" },
  { name: "EventTextIndex" }
);

const Event = model("Event", eventSchema);

export default Event;
