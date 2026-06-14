export const EVENT_STATUSES = ["draft", "published", "cancelled"];
export const EVENT_STATUS_TRANSITIONS = {
  draft: ["published", "cancelled"],
  published: ["cancelled"],
  cancelled: [],
};

export function canTransitionEventStatus(currentStatus, nextStatus) {
  return EVENT_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

export function assertEventStatusTransition(currentStatus, nextStatus) {
  if (!EVENT_STATUSES.includes(nextStatus)) {
    throw new Error("Invalid event status");
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  if (!canTransitionEventStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Cannot transition event from ${currentStatus} to ${nextStatus}`
    );
  }

  return true;
}
