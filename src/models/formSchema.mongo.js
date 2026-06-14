import { Schema, model } from "mongoose";

export const BUILTIN_FORM_FIELDS = ["name", "email", "phone"];
export const FORM_QUESTION_TYPES = ["text", "textarea", "select", "checkbox"];
export const DEFAULT_BUILTIN_FORM_FIELDS = [
  { field: "name", required: true },
  { field: "email", required: true },
];
const createDefaultBuiltinFormFields = () =>
  DEFAULT_BUILTIN_FORM_FIELDS.map(fieldConfig => ({ ...fieldConfig }));

const builtinFieldSchema = new Schema(
  {
    field: {
      type: String,
      enum: BUILTIN_FORM_FIELDS,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const customQuestionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: FORM_QUESTION_TYPES,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
      set: options =>
        Array.isArray(options)
          ? options.map(option => option.trim()).filter(Boolean)
          : [],
    },
  },
  { _id: false }
);

const formSchema = new Schema(
  {
    builtinFields: {
      type: [builtinFieldSchema],
      default: createDefaultBuiltinFormFields,
    },
    customQuestions: {
      type: [customQuestionSchema],
      default: [],
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

formSchema.index({ createdBy: 1, updatedAt: -1 });

const FormSchema = model("FormSchema", formSchema);

export default FormSchema;
