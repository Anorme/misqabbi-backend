import { model, Schema } from "mongoose";
/**
 * @typedef ResetToken
 * @property {Schema.Types.ObjectId} userId - Reference to the User who requested the reset
 * @property {String} token                - Unique reset token string
 * @property {Date} createdAt              - Timestamp of token creation
 * @property {Date} updatedAt              - Timestamp of last update
 */
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
