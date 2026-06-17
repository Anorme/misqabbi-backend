export function assertEventIsPublic(event) {
  if (!event || event.status !== "published") {
    throw new Error("Event not found");
  }
}

function toPlainObject(value) {
  if (!value) return null;

  return typeof value.toObject === "function" ? value.toObject() : value;
}

function getId(value) {
  return value?._id ?? value?.id;
}

function getRemainingQuantity(ticketType) {
  return Math.max(
    Number(ticketType.maxQuantity ?? 0) - Number(ticketType.soldCount ?? 0),
    0
  );
}

export function toPublicFormSchema(formSchema) {
  const schema = toPlainObject(formSchema);
  if (!schema) return null;

  return {
    _id: getId(schema),
    builtinFields: schema.builtinFields ?? [],
    customQuestions: schema.customQuestions ?? [],
  };
}

export function toPublicTicketType(ticketType) {
  const ticket = toPlainObject(ticketType);
  if (!ticket) return null;

  return {
    _id: getId(ticket),
    name: ticket.name,
    pricePesewas: ticket.pricePesewas,
    expiresAt: ticket.expiresAt,
    isActive: ticket.isActive,
    remainingQuantity: getRemainingQuantity(ticket),
  };
}

export function toPublicEventListItem(event) {
  const publicEvent = toPlainObject(event);
  if (!publicEvent) return null;

  return {
    _id: getId(publicEvent),
    slug: publicEvent.slug,
    name: publicEvent.name,
    description: publicEvent.description,
    eventDate: publicEvent.eventDate,
    type: publicEvent.type,
    status: publicEvent.status,
    maxAttendees: publicEvent.maxAttendees,
    venue: publicEvent.venue,
    banner: publicEvent.banner,
    createdAt: publicEvent.createdAt,
    updatedAt: publicEvent.updatedAt,
  };
}

export function toPublicEventDetail(event, confirmedCount = 0) {
  const publicEvent = toPlainObject(event);
  if (!publicEvent) return null;

  const listItem = toPublicEventListItem(publicEvent);
  const spotsRemaining = Math.max(
    Number(publicEvent.maxAttendees ?? 0) - Number(confirmedCount ?? 0),
    0
  );

  return {
    ...listItem,
    registrationForm: toPublicFormSchema(publicEvent.registrationFormId),
    volunteerForm: toPublicFormSchema(publicEvent.volunteerFormId),
    ticketTypes: (publicEvent.ticketTypes ?? [])
      .map(toPublicTicketType)
      .filter(Boolean),
    spotsRemaining,
  };
}
