import { countConfirmedRegistrations } from "../models/eventRegistration.model.js";
import {
  assertEventAcceptsRegistrations,
  checkCapacity,
  getTicketTypeById,
  hasEventCapacity,
  hasTicketCapacity,
} from "./eventCapacityLogic.js";

export {
  assertEventAcceptsRegistrations,
  getTicketTypeById,
  hasEventCapacity,
  hasTicketCapacity,
};

export async function getConfirmedCount(eventId, params = {}) {
  return countConfirmedRegistrations(eventId, params);
}

export async function hasCapacity(event, additionalCount = 1, options = {}) {
  const confirmedCount =
    options.confirmedCount ??
    (await getConfirmedCount(event._id ?? event.id, {
      ticketTypeId: options.ticketTypeId,
    }));

  return checkCapacity(event, additionalCount, {
    ...options,
    confirmedCount,
  });
}
