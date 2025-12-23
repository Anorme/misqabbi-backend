import { createLocalUser } from "../../src/models/user.model.js";
import { createProduct as createProductModel } from "../../src/models/product.model.js";

/**
 * @param {Object} overrides - Fields to override default values
 * @returns {Promise<Object>} Created user document
 */
export async function createUser(overrides = {}) {
  const randomId = Math.random().toString(36).substring(2, 6);
  const defaultUser = {
    email: `testuser_${randomId}@example.com`,
    password: "Test123!@#", // Must meet password requirements
    displayName: `Test User ${randomId}`,
    role: "user",
    ...overrides,
  };

  return await createLocalUser(defaultUser);
}

/**
 * @param {Object} overrides - Fields to override default values
 * @returns {Promise<Object>} Created admin user document
 */
export async function createAdminUser(overrides = {}) {
  const user = await createUser(overrides);
  user.role = "admin";
  await user.save();
  return user;
}

/**
 * Create a test product with default or custom data
 * @param {Object} overrides - Fields to override default values
 * @returns {Promise<Object>} Created product document
 */
export async function createProduct(overrides = {}) {
  const randomId = Math.random().toString(36).substring(2, 6);
  const defaultProduct = {
    name: `Test Product ${randomId}`,
    description: "A test product description",
    price: 100.0,
    stock: 10,
    category: "dress",
    isPublished: true,
    isVariant: false,
    images: [
      {
        url: "https://example.com/image1.jpg",
        publicId: "test-image-1",
      },
    ],
    ...overrides,
  };

  return await createProductModel(defaultProduct);
}

/**
 * Create a product variant (for testing variant functionality)
 * @param {Object} baseProduct - The base product this variant belongs to
 * @param {Object} overrides - Fields to override default values
 * @returns {Promise<Object>} Created variant product document
 */
export async function createProductVariant(baseProduct, overrides = {}) {
  const randomId = Math.random().toString(36).substring(2, 6);
  const defaultVariant = {
    name: `${baseProduct.name} - Variant ${randomId}`,
    description: baseProduct.description,
    price: baseProduct.price + 10,
    stock: 5,
    category: baseProduct.category,
    isPublished: false,
    isVariant: true,
    baseProduct: baseProduct._id,
    variantType: "color",
    swatchImage: {
      url: "https://example.com/swatch.jpg",
      publicId: "test-swatch",
    },
    images: [
      {
        url: "https://example.com/variant-image.jpg",
        publicId: "test-variant-image",
      },
    ],
    ...overrides,
  };

  return await createProductModel(defaultVariant);
}

/**
 * @param {Array<Object>} products - Array of product documents
 * @param {Object} overrides - Override default item properties
 * @returns {Array<Object>} Array of order item objects
 */
export function createOrderItems(products, overrides = {}) {
  if (!products || products.length === 0) {
    throw new Error("At least one product is required");
  }

  return products.map((product, index) => ({
    product: product._id,
    quantity: 1,
    price: product.price,
    size: "M",
    customSize: undefined,
    ...overrides[index],
    ...overrides,
  }));
}

/**
 * @param {Object} overrides - Fields to override default values
 * @returns {Object} Shipping info object
 */
export function createShippingInfo(overrides = {}) {
  return {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+233123456789",
    deliveryAddress: "123 Test Street, Accra, Ghana",
    deliveryNotes: "Please call before delivery",
    ...overrides,
  };
}

/**
 * @param {Array<Object>} products - Array of product documents
 * @param {Object} options - Options for items and shipping info
 * @returns {Object} Complete checkout payload
 */
export function createCheckoutPayload(products, options = {}) {
  return {
    items: createOrderItems(products, options.items),
    shippingInfo: createShippingInfo(options.shippingInfo),
  };
}

/**
 * @param {Object} user - User document
 * @param {Object} orderData - Order data (items, shippingInfo, etc.)
 * @param {Object} overrides - Fields to override default values
 * @returns {Object} Transaction data object
 */
export function createTransactionData(user, orderData, overrides = {}) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const reference = `MISQ_${timestamp}_${user._id}_${randomSuffix}`;

  const totalPrice =
    orderData.items?.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) || 0;

  return {
    reference,
    user: user._id,
    amount: Math.round(totalPrice * 100),
    currency: "GHS",
    status: "pending",
    orderData: {
      items: orderData.items,
      shippingInfo: orderData.shippingInfo,
      totalPrice,
      expressService: false,
      expressFee: 0,
      ...orderData,
    },
    ...overrides,
  };
}
