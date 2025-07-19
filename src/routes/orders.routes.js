const express = require("express");
const router = express.Router();

// TODO: Import authenticateToken middleware when ready
// const authenticateToken = require('../middleware/auth.middleware');

// TODO: Import orders controller functions when implemented
// const { createOrder, getOrders, getOrderById } = require('../controllers/orders.controller');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Protected
router.post(
  "/",
  /* authenticateToken, */ (req, res) => {
    // TODO: Implement createOrder controller
    return res
      .status(501)
      .json({ message: "Create order not yet implemented" });
  }
);

// @route   GET /api/orders
// @desc    Get all orders for authenticated user
// @access  Protected
router.get(
  "/",
  /* authenticateToken, */ (req, res) => {
    // TODO: Implement getOrders controller
    return res.status(501).json({ message: "Get orders not yet implemented" });
  }
);

// @route   GET /api/orders/:id
// @desc    Get a specific order by ID
// @access  Protected
router.get(
  "/:id",
  /* authenticateToken, */ (req, res) => {
    // TODO: Implement getOrderById controller
    return res
      .status(501)
      .json({ message: "Get order by ID not yet implemented" });
  }
);

module.exports = router;
