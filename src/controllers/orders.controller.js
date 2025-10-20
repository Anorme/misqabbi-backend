import {
  getPaginatedOrdersByUser,
  countOrdersByUser,
  fetchOrderById,
} from "../models/order.model.js";
import { createTransaction } from "../models/transaction.model.js";
import Product from "../models/product.mongo.js";
import {
  initializeTransaction,
  generateTransactionReference,
  convertToPesewas,
} from "../services/paystackService.js";
import logger from "../config/logger.js";
import { formatResponse } from "../utils/responseFormatter.js";

export const initializeCheckout = async (req, res) => {
  const { items, shippingInfo } = req.body;
  const userId = req.user._id;

  try {
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json(formatResponse({ success: false, error: "Cart is empty" }));
    }

    const itemProductIds = items.map(item => item.product);
    // Fetch only currently published products that match the requested ids.
    // This guards against ordering unpublished/disabled items even if the client includes them.
    const publishedProducts = await Product.find({
      _id: { $in: itemProductIds },
      isPublished: true,
    });

    // Convert to a Set for O(1) membership checks when validating the incoming cart items.
    const publishedProductIds = new Set(
      publishedProducts.map(product => product._id.toString())
    );

    const allItemsArePublished = items.every(item =>
      publishedProductIds.has(item.product.toString())
    );
    if (!allItemsArePublished) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Some products are not available or unpublished",
        })
      );
    }

    let calculatedTotalPrice = 0;
    const validatedItems = [];
    for (const item of items) {
      // Re-derive authoritative price from the database to prevent client-side tampering.
      const product = publishedProducts.find(
        p => p._id.toString() === item.product.toString()
      );
      if (!product) {
        return res
          .status(400)
          .json(formatResponse({ success: false, error: "Product not found" }));
      }
      calculatedTotalPrice += product.price * item.quantity;
      validatedItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
        customSize: item.customSize,
      });
    }

    // Paystack amounts are in the smallest currency unit (pesewas).
    const amountInPesewas = convertToPesewas(calculatedTotalPrice);

    // Generate a unique reference for the transaction
    const reference = generateTransactionReference(userId.toString());

    const transactionData = {
      reference,
      user: userId,
      amount: amountInPesewas,
      currency: "GHS",
      status: "pending",
      orderData: {
        items: validatedItems,
        shippingInfo,
        totalPrice: calculatedTotalPrice,
      },
    };
    const transaction = await createTransaction(transactionData);

    // Initialize the Paystack transaction
    const paystackResponse = await initializeTransaction(
      req.user.email,
      amountInPesewas,
      {
        userId: userId.toString(),
        transactionId: transaction._id.toString(),
        items: validatedItems.length,
      },
      reference
    );

    transaction.paystackResponse = paystackResponse;
    await transaction.save();

    return res.status(200).json(
      formatResponse({
        message: "Payment initialized successfully",
        data: {
          authorizationUrl: paystackResponse.data.authorization_url,
          reference,
          amount: calculatedTotalPrice,
          currency: "GHS",
        },
      })
    );
  } catch (error) {
    logger.warn(
      `[orders.controller] Error initializing checkout: ${error.message}`
    );
    return res.status(500).json(
      formatResponse({
        success: false,
        error: "Checkout initialization failed due to server error",
      })
    );
  }
};

export const getOrders = async (req, res) => {
  const userId = req.user._id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  try {
    const [orders, total] = await Promise.all([
      getPaginatedOrdersByUser(userId, page, limit),
      countOrdersByUser(userId),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.warn(error);
    return res.status(500).json({ error: "Failed to retrieve orders" });
  }
};

export const getOrderById = async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  try {
    const order = await fetchOrderById(orderId, userId);
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.warn(error);
    return res.status(500).json({ error: "Failed to retrieve order" });
  }
};
