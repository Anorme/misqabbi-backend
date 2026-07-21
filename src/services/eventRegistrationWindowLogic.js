export const REGISTRATION_CLOSED_MESSAGE =
  "Registration for this event has closed";

export function isEventRegistrationOpen(event, now = new Date()) {
  if (!event?.eventDate) {
    return false;
  }

  const eventDate = new Date(event.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return false;
  }

  return now < eventDate;
}

export function assertEventRegistrationOpen(event, now = new Date()) {
  if (!isEventRegistrationOpen(event, now)) {
    throw new Error(REGISTRATION_CLOSED_MESSAGE);
  }
}
