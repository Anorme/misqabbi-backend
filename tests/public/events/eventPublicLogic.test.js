/*eslint-disable no-undef */
import {
  assertEventIsPublic,
  toPublicEventDetail,
  toPublicEventListItem,
  toPublicFormSchema,
  toPublicTicketType,
} from "../../../src/services/eventPublicLogic.js";

describe("eventPublicLogic", () => {
  const formSchema = {
    _id: "64a000000000000000000020",
    builtinFields: [{ field: "email", required: true }],
    customQuestions: [{ id: "q1", label: "Question", type: "text" }],
    createdBy: "admin-id",
  };
  const event = {
    _id: "64a000000000000000000010",
    slug: "public-event",
    name: "Public Event",
    description: "A public event",
    eventDate: "2026-08-01T18:00:00.000Z",
    type: "paid",
    status: "published",
    maxAttendees: 20,
    venue: { name: "Main Hall" },
    banner: { url: "https://example.com/banner.jpg", publicId: "banner-id" },
    registrationFormId: formSchema,
    volunteerFormId: formSchema,
    ticketTypes: [
      {
        _id: "64a000000000000000000001",
        name: "Early Bird",
        pricePesewas: 5000,
        maxQuantity: 10,
        soldCount: 3,
        expiresAt: "2026-08-02T18:00:00.000Z",
        isActive: true,
      },
    ],
    createdBy: { _id: "admin-id", email: "admin@example.com" },
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
  };

  it("allows only published events to be public", () => {
    expect(() => assertEventIsPublic(event)).not.toThrow();
    expect(() => assertEventIsPublic(null)).toThrow("Event not found");
    expect(() => assertEventIsPublic({ ...event, status: "draft" })).toThrow(
      "Event not found"
    );
    expect(() => assertEventIsPublic({ ...event, status: "cancelled" })).toThrow(
      "Event not found"
    );
  });

  it("shapes public list items without internal event relationships", () => {
    expect(toPublicEventListItem(event)).toEqual({
      _id: event._id,
      slug: event.slug,
      name: event.name,
      description: event.description,
      eventDate: event.eventDate,
      type: event.type,
      status: event.status,
      maxAttendees: event.maxAttendees,
      venue: event.venue,
      banner: event.banner,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });
  });

  it("shapes public form schemas without owner metadata", () => {
    expect(toPublicFormSchema(formSchema)).toEqual({
      _id: formSchema._id,
      builtinFields: formSchema.builtinFields,
      customQuestions: formSchema.customQuestions,
    });
  });

  it("shapes public ticket types without sold count", () => {
    expect(toPublicTicketType(event.ticketTypes[0])).toEqual({
      _id: event.ticketTypes[0]._id,
      name: "Early Bird",
      pricePesewas: 5000,
      expiresAt: "2026-08-02T18:00:00.000Z",
      isActive: true,
      remainingQuantity: 7,
    });
  });

  it("includes forms, ticket availability, and event spots on detail", () => {
    expect(toPublicEventDetail(event, 6)).toMatchObject({
      _id: event._id,
      registrationForm: {
        builtinFields: formSchema.builtinFields,
        customQuestions: formSchema.customQuestions,
      },
      volunteerForm: {
        builtinFields: formSchema.builtinFields,
        customQuestions: formSchema.customQuestions,
      },
      ticketTypes: [{ remainingQuantity: 7 }],
      spotsRemaining: 14,
    });
  });
});
