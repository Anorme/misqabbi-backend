export function computeDefaultExpiry(eventDate) {
  const parsedEventDate = new Date(eventDate);

  if (Number.isNaN(parsedEventDate.getTime())) {
    throw new Error("Invalid event date");
  }

  return parsedEventDate;
}

export function canDeleteTicketType(ticketType) {
  return Number(ticketType?.soldCount ?? 0) === 0;
}

export function assertPaidEventSupportsTickets(event) {
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.type !== "paid") {
    throw new Error("Ticket types can only be configured for paid events");
  }
}

export function buildTicketTypePayload(ticketTypeData, event) {
  const hasManualExpiry = Boolean(ticketTypeData.expiresAt);
  const expiresAt = hasManualExpiry
    ? new Date(ticketTypeData.expiresAt)
    : computeDefaultExpiry(event.eventDate);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid ticket expiry date");
  }

  return {
    name: ticketTypeData.name,
    pricePesewas: ticketTypeData.pricePesewas,
    maxQuantity: ticketTypeData.maxQuantity,
    soldCount: 0,
    expiresAt,
    expirySource: hasManualExpiry ? "manual" : "auto",
    isActive: ticketTypeData.isActive ?? true,
  };
}

export function recomputeAutoTicketExpiries(ticketTypes = [], eventDate) {
  const nextExpiry = computeDefaultExpiry(eventDate);

  return ticketTypes.map(ticketType => {
    const payload =
      typeof ticketType.toObject === "function"
        ? ticketType.toObject()
        : { ...ticketType };

    if (payload.expirySource === "auto") {
      payload.expiresAt = nextExpiry;
    }

    return payload;
  });
}

export function assertCanDeleteTicketType(ticketType) {
  if (!ticketType) {
    throw new Error("Ticket type not found");
  }

  if (!canDeleteTicketType(ticketType)) {
    throw new Error("Ticket types with purchased tickets cannot be deleted");
  }
}

export function assertCanUpdateTicketType(ticketType, updates) {
  if (!ticketType) {
    throw new Error("Ticket type not found");
  }

  if (
    updates.maxQuantity !== undefined &&
    Number(updates.maxQuantity) < Number(ticketType.soldCount ?? 0)
  ) {
    throw new Error("Ticket max quantity cannot be less than tickets sold");
  }
}

export function hasActiveTicketType(event) {
  return event?.ticketTypes?.some(ticketType => ticketType.isActive) ?? false;
}

export function assertPaidEventCanPublish(event) {
  if (event?.type === "paid" && !hasActiveTicketType(event)) {
    throw new Error("Paid events require at least one active ticket type");
  }
}

export function isTicketPurchasable(
  ticketType,
  event,
  quantity = 1,
  now = new Date()
) {
  if (!ticketType || !event) return false;
  if (event.type !== "paid" || event.status !== "published") return false;
  if (!ticketType.isActive) return false;
  if (new Date(ticketType.expiresAt) <= now) return false;

  const remaining =
    Number(ticketType.maxQuantity ?? 0) - Number(ticketType.soldCount ?? 0);

  return remaining >= quantity;
}
