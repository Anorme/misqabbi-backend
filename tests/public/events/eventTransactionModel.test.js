/*eslint-disable no-undef */
import { Types } from "mongoose";
import Transaction from "../../../src/models/transaction.mongo.js";

describe("Transaction event ticket fields", () => {
  it("validates event ticket transactions without order data", () => {
    const transaction = new Transaction({
      reference: "MISQ_EVENT_123",
      user: new Types.ObjectId(),
      amount: 10000,
      currency: "GHS",
      status: "pending",
      purpose: "event_ticket",
      eventPurchaseData: {
        eventId: new Types.ObjectId(),
        ticketTypeId: new Types.ObjectId(),
        quantity: 2,
        ticketName: "Early Bird",
        pricePerTicket: 5000,
        totalPrice: 10000,
      },
      eventRegistration: new Types.ObjectId(),
    });

    expect(transaction.validateSync()).toBeUndefined();
  });

  it("defaults purpose to order for existing checkout transactions", () => {
    const transaction = new Transaction({
      reference: "MISQ_ORDER_123",
      user: new Types.ObjectId(),
      amount: 10000,
      currency: "GHS",
      status: "pending",
      orderData: {
        items: [],
        shippingInfo: {
          fullName: "Ama",
          email: "ama@example.com",
          phone: "0240000000",
          deliveryAddress: "Accra",
        },
        totalPrice: 100,
      },
    });

    expect(transaction.purpose).toBe("order");
  });
});
