export function assertEventSupportsRegistrationForm(event) {
  if (!event) {
    throw new Error("Event not found");
  }

  if (!["free", "paid"].includes(event.type)) {
    throw new Error("Registration forms can only be configured for events");
  }

  return true;
}

export function getLinkedFormId(event, formKey = "registrationFormId") {
  const linkedForm = event?.[formKey];

  if (!linkedForm) {
    return null;
  }

  if (typeof linkedForm === "object" && linkedForm._id) {
    return linkedForm._id.toString();
  }

  return linkedForm.toString();
}

export function hasLinkedForm(event, formKey = "registrationFormId") {
  return Boolean(getLinkedFormId(event, formKey));
}
