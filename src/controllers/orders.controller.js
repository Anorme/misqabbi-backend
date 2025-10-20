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
    // Check if items array is empty
    if (!items || items.length === 0) {
      return res.status(400).json(
        formatResponse({
          success: false,
          error: "Cart is empty",
        })
      );
    }

    // Get IDs of products in the items array
    const itemProductIds = items.map(item => item.product);

    // Fetch published products that match the item IDs
    const publishedProducts = await Product.find({
      _id: { $in: itemProductIds },
      isPublished: true,
    });

    // Convert publishedProducts ids to strings and store in the publishedProductIds set
    const publishedProductIds = new Set(
      publishedProducts.map(product => product._id.toString())
    );

    // Check if every item's productId is present in the publishedProductIds set
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

    // Calculate total price from product prices
    let calculatedTotalPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = publishedProducts.find(
        p => p._id.toString() === item.product.toString()
      );
      if (!product) {
        return res.status(400).json(
          formatResponse({
            success: false,
            error: "Product not found",
          })
        );
      }

      const itemTotal = product.price * item.quantity;
      calculatedTotalPrice += itemTotal;

      validatedItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
        customSize: item.customSize,
      });
    }

    // Convert to pesewas
    const amountInPesewas = convertToPesewas(calculatedTotalPrice);

    // Generate unique reference
    const reference = generateTransactionReference(userId);

    // Create transaction record
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

    // Initialize Paystack transaction
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

    // Update transaction with Paystack response
    transaction.paystackResponse = paystackResponse;
    await transaction.save();

    res.status(200).json(
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
    res.status(500).json(
      formatResponse({
        success: false,
        error: "Checkout initialization failed due to server error",
      })
    );
  }
};

//get all orders
export const getOrders = async (req, res) => {
  const userId = req.user._id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  try {
    const [orders, total] = await Promise.all([
      getPaginatedOrdersByUser(userId, page, limit),
      countOrdersByUser(userId),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
};

//get order by id
export const getOrderById = async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  try {
    const order = await fetchOrderById(orderId, userId);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.warn(error);
    res.status(500).json({ error: "Failed to retrieve order" });
  }
};
