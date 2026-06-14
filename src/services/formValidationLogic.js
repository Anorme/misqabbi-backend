const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BUILTIN_FIELD_VALIDATORS = {
  name: value => typeof value === "string" && value.trim().length > 0,
  email: value => typeof value === "string" && EMAIL_REGEX.test(value.trim()),
  phone: value => typeof value === "string" && value.trim().length > 0,
};

function toPlainFormSchema(formSchema) {
  if (!formSchema) {
    return { builtinFields: [], customQuestions: [] };
  }

  if (typeof formSchema.toObject === "function") {
    return formSchema.toObject();
  }

  return formSchema;
}

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeIdentity(identity = {}, overrides = {}) {
  return {
    ...identity,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => !isMissing(value))
    ),
  };
}

function validateBuiltinFields(schemaFields, identity, errors) {
  const normalized = {};

  for (const fieldConfig of schemaFields) {
    const { field, required } = fieldConfig;
    const value = identity[field];

    if (required && isMissing(value)) {
      errors.push(`${field} is required`);
      continue;
    }

    if (isMissing(value)) {
      continue;
    }

    const normalizedValue = normalizeString(value);
    const validator = BUILTIN_FIELD_VALIDATORS[field];

    if (!validator?.(normalizedValue)) {
      errors.push(`${field} is invalid`);
      continue;
    }

    normalized[field] = normalizedValue;
  }

  return normalized;
}

function validateTextAnswer(question, value, errors) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${question.label} must be answered with text`);
    return undefined;
  }

  return value.trim();
}

function validateSelectAnswer(question, value, errors) {
  const normalizedValue = normalizeString(value);

  if (!question.options?.includes(normalizedValue)) {
    errors.push(`${question.label} must match one of the configured options`);
    return undefined;
  }

  return normalizedValue;
}

function validateCheckboxAnswer(question, value, errors) {
  if (typeof value !== "boolean") {
    errors.push(`${question.label} must be answered with true or false`);
    return undefined;
  }

  return value;
}

function validateCustomQuestions(questions, answers, errors) {
  const configuredQuestions = new Map(
    questions.map(question => [question.id, question])
  );
  const normalized = {};

  for (const questionId of Object.keys(answers)) {
    if (!configuredQuestions.has(questionId)) {
      errors.push(`Unknown custom question submitted: ${questionId}`);
    }
  }

  for (const question of questions) {
    const value = answers[question.id];

    if (question.required && isMissing(value)) {
      errors.push(`${question.label} is required`);
      continue;
    }

    if (isMissing(value)) {
      continue;
    }

    let normalizedAnswer;
    if (question.type === "text" || question.type === "textarea") {
      normalizedAnswer = validateTextAnswer(question, value, errors);
    } else if (question.type === "select") {
      normalizedAnswer = validateSelectAnswer(question, value, errors);
    } else if (question.type === "checkbox") {
      normalizedAnswer = validateCheckboxAnswer(question, value, errors);
    } else {
      errors.push(`${question.label} has an unsupported question type`);
    }

    if (normalizedAnswer !== undefined) {
      normalized[question.id] = normalizedAnswer;
    }
  }

  return normalized;
}

export function validateFormResponses(formSchema, responses = {}) {
  const schema = toPlainFormSchema(formSchema);
  const errors = [];
  const customAnswers = responses.customAnswers ?? {};

  if (responses.builtinFields !== undefined) {
    errors.push("formResponses.builtinFields is no longer supported");
  }

  if (
    typeof customAnswers !== "object" ||
    Array.isArray(customAnswers) ||
    customAnswers === null
  ) {
    errors.push("customAnswers responses must be an object");
  }

  const safeCustomAnswers = errors.includes(
    "customAnswers responses must be an object"
  )
    ? {}
    : customAnswers;

  const normalizedResponses = {
    customAnswers: validateCustomQuestions(
      schema.customQuestions ?? [],
      safeCustomAnswers,
      errors
    ),
  };

  return {
    valid: errors.length === 0,
    errors,
    normalizedResponses,
  };
}

export function validateIdentityInfo(
  schemaBuiltinFields = [],
  identity = {},
  { resolvedEmail } = {}
) {
  const errors = [];
  const identityInput = normalizeIdentity(identity, { email: resolvedEmail });

  if (
    typeof identityInput !== "object" ||
    Array.isArray(identityInput) ||
    identityInput === null
  ) {
    errors.push("identity info must be an object");
  }

  const normalizedIdentity = errors.includes("identity info must be an object")
    ? {}
    : validateBuiltinFields(schemaBuiltinFields, identityInput, errors);

  return {
    valid: errors.length === 0,
    errors,
    normalizedIdentity,
  };
}

export function validateFormSubmission(
  formSchema,
  { identity = {}, customAnswers = {}, resolvedEmail } = {}
) {
  const schema = toPlainFormSchema(formSchema);
  const errors = [];

  if (
    typeof customAnswers !== "object" ||
    Array.isArray(customAnswers) ||
    customAnswers === null
  ) {
    errors.push("customAnswers responses must be an object");
  }

  const identityValidation = validateIdentityInfo(
    schema.builtinFields ?? [],
    identity,
    { resolvedEmail }
  );
  errors.push(...identityValidation.errors);

  const safeCustomAnswers = errors.includes(
    "customAnswers responses must be an object"
  )
    ? {}
    : customAnswers;

  const normalizedCustomAnswers = validateCustomQuestions(
    schema.customQuestions ?? [],
    safeCustomAnswers,
    errors
  );

  return {
    valid: errors.length === 0,
    errors,
    normalizedIdentity: identityValidation.normalizedIdentity,
    normalizedCustomAnswers,
  };
}
