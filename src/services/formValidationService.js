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

function validateBuiltinFields(schemaFields, responses, errors) {
  const configuredFields = new Set(schemaFields.map(({ field }) => field));
  const submittedFields = Object.keys(responses);
  const normalized = {};

  for (const field of submittedFields) {
    if (!configuredFields.has(field)) {
      errors.push(`Unknown builtin field submitted: ${field}`);
    }
  }

  for (const fieldConfig of schemaFields) {
    const { field, required } = fieldConfig;
    const value = responses[field];

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
  const builtinResponses = responses.builtinFields ?? {};
  const customAnswers = responses.customAnswers ?? {};

  if (
    typeof builtinResponses !== "object" ||
    Array.isArray(builtinResponses) ||
    builtinResponses === null
  ) {
    errors.push("builtinFields responses must be an object");
  }

  if (
    typeof customAnswers !== "object" ||
    Array.isArray(customAnswers) ||
    customAnswers === null
  ) {
    errors.push("customAnswers responses must be an object");
  }

  const safeBuiltinResponses = errors.includes(
    "builtinFields responses must be an object"
  )
    ? {}
    : builtinResponses;
  const safeCustomAnswers = errors.includes(
    "customAnswers responses must be an object"
  )
    ? {}
    : customAnswers;

  const normalizedResponses = {
    builtinFields: validateBuiltinFields(
      schema.builtinFields ?? [],
      safeBuiltinResponses,
      errors
    ),
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
