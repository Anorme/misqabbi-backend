import { model, Schema } from "mongoose";

const resetTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // 1 hour expiration
  },
  { timestamps: true }
);

const ResetToken = model("ResetToken", resetTokenSchema);

export default ResetToken;
