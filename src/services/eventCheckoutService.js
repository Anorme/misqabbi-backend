import { createTransaction } from "../models/transaction.model.js";
import {
  createEventRegistration,
  updateEventRegistrationPayment,
} from "../models/eventRegistration.model.js";
import {
  getEventById,
  incrementEventTicketSoldCount,
} from "../models/event.model.js";
import {
  generateTransactionReference,
  initializeTransaction,
} from "./paystackService.js";
import { getConfirmedCount } from "./eventCapacityService.js";
import {
  assertEventTicketCheckoutAllowed,
  buildEventPurchaseData,
  calculateTicketPurchaseAmount,
  getPayerEmail,
} from "./eventCheckoutLogic.js";

export {
  assertEventTicketCheckoutAllowed,
  buildEventPurchaseData,
  calculateTicketPurchaseAmount,
  getPayerEmail,
};

export async function initializeEventTicketCheckout({
  eventId,
  principal,
  ticketTypeId,
  quantity,
  guestInfo = {},
  formResponses = {},
  confirmedCount,
}) {
  const event = await getEventById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  const ticketType = event.ticketTypes.id(ticketTypeId);
  const effectiveConfirmedCount =
    confirmedCount ?? (await getConfirmedCount(event._id));
  assertEventTicketCheckoutAllowed(
    event,
    ticketType,
    quantity,
    effectiveConfirmedCount
  );

  const payerEmail = getPayerEmail(principal, guestInfo);
  if (!payerEmail) {
    throw new Error("A valid email is required to initialize payment");
  }

  const eventPurchaseData = buildEventPurchaseData(event, ticketType, quantity);
  const registration = await createEventRegistration({
    event: event._id,
    user: principal?._id ?? null,
    guestInfo,
    formResponses,
    ticketTypeId: ticketType._id,
    status: "pending",
  });
  const reference = generateTransactionReference(principal._id.toString());
  const transaction = await createTransaction({
    reference,
    user: principal._id,
    amount: eventPurchaseData.totalPrice,
    currency: "GHS",
    status: "pending",
    purpose: "event_ticket",
    eventPurchaseData,
    eventRegistration: registration._id,
  });

  const paystackResponse = await initializeTransaction(
    payerEmail,
    eventPurchaseData.totalPrice,
    {
      purpose: "event_ticket",
      userId: principal._id.toString(),
      transactionId: transaction._id.toString(),
      eventId: event._id.toString(),
      eventRegistrationId: registration._id.toString(),
      ticketTypeId: ticketType._id.toString(),
      quantity,
    },
    reference
  );

  transaction.paystackResponse = paystackResponse;
  await transaction.save();

  return {
    authorizationUrl: paystackResponse.data.authorization_url,
    reference,
    amount: eventPurchaseData.totalPrice / 100,
    amountPesewas: eventPurchaseData.totalPrice,
    currency: "GHS",
    eventRegistration: registration,
    transaction,
  };
}

export async function confirmEventTicketPayment(transaction) {
  if (transaction.eventRegistration?.status === "confirmed") {
    return transaction.eventRegistration;
  }

  const { eventPurchaseData } = transaction;
  const event = await getEventById(eventPurchaseData.eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  const ticketType = event.ticketTypes.id(eventPurchaseData.ticketTypeId);
  const confirmedCount = await getConfirmedCount(event._id);
  assertEventTicketCheckoutAllowed(
    event,
    ticketType,
    eventPurchaseData.quantity,
    confirmedCount
  );

  await incrementEventTicketSoldCount(
    event._id,
    ticketType._id,
    eventPurchaseData.quantity
  );

  const eventRegistrationId =
    transaction.eventRegistration?._id ?? transaction.eventRegistration;

  return updateEventRegistrationPayment(eventRegistrationId, {
    status: "confirmed",
    transactionId: transaction._id,
  });
}

export async function cancelEventTicketRegistration(transaction) {
  if (!transaction?.eventRegistration) return null;

  const eventRegistrationId =
    transaction.eventRegistration?._id ?? transaction.eventRegistration;

  return updateEventRegistrationPayment(eventRegistrationId, {
    status: "cancelled",
    transactionId: transaction._id,
  });
}
