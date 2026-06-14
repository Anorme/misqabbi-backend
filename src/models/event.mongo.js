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
