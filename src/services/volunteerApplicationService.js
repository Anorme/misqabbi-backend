export const VOLUNTEER_APPLICATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
];

export const VOLUNTEER_APPLICATION_STATUS_TRANSITIONS = {
  pending: ["accepted", "rejected"],
  accepted: ["rejected"],
  rejected: ["accepted"],
};

export function canTransitionVolunteerApplicationStatus(
  currentStatus,
  nextStatus
) {
  return (
    VOLUNTEER_APPLICATION_STATUS_TRANSITIONS[currentStatus]?.includes(
      nextStatus
    ) ?? false
  );
}

export function assertVolunteerApplicationStatusTransition(
  currentStatus,
  nextStatus
) {
  if (!VOLUNTEER_APPLICATION_STATUSES.includes(nextStatus)) {
    throw new Error("Invalid volunteer application status");
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  if (!canTransitionVolunteerApplicationStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Cannot transition volunteer application from ${currentStatus} to ${nextStatus}`
    );
  }

  return true;
}
