import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Misqabbi e-commerce API",
      version: "1.0.0",
      description: "API documentation for contributors",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        CartItem: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: {
              type: "string",
              format: "uuid",
              description: "MongoDB ObjectId referencing the Product",
            },
            quantity: {
              type: "integer",
              minimum: 1,
              description: "Number of units of the product",
            },
          },
          example: {
            productId: "64e3f9c2a1b2c3d4e5f6a7b8",
            quantity: 2,
          },
        },
        Product: {
          type: "object",
          required: ["name", "description", "price", "category", "stock"],
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for the product",
            },
            name: {
              type: "string",
              description: "Name of the product",
            },
            description: {
              type: "string",
              description: "Detailed description of the product",
            },
            price: {
              type: "number",
              format: "float",
              description: "Price of the product",
            },
            images: {
              type: "array",
              items: {
                type: "string",
                format: "uri",
              },
              description: "Array of image URLs",
            },
            category: {
              type: "string",
              description: "Category the product belongs to",
            },
            stock: {
              type: "integer",
              description: "Available stock quantity",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp of creation",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp of last update",
            },
          },
        },
        Order: {
          type: "object",
          required: ["user", "items", "status"],
          properties: {
            user: {
              type: "string",
              format: "objectId",
              description:
                "MongoDB ObjectId referencing the user who placed the order",
            },
            items: {
              type: "array",
              description: "List of ordered items",
              items: {
                type: "object",
                required: ["product", "quantity", "price"],
                properties: {
                  product: {
                    type: "string",
                    format: "objectId",
                    description: "MongoDB ObjectId referencing the product",
                  },
                  quantity: {
                    type: "integer",
                    minimum: 1,
                    description: "Quantity of the product ordered",
                  },
                  price: {
                    type: "number",
                    minimum: 0,
                    format: "float",
                    description: "Price of the product at time of order",
                  },
                },
              },
            },
            totalPrice: {
              type: "number",
              minimum: 0,
              format: "float",
              description: "Total price of the entire order",
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
              description: "Current status of the order",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the order was created",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the order was last updated",
            },
          },
          example: {
            user: "64e3f9c2a1b2c3d4e5f6a7b8",
            items: [
              {
                product: "64e3f9c2a1b2c3d4e5f6a7b9",
                quantity: 2,
                price: 49.99,
              },
            ],
            totalPrice: 99.98,
            status: "paid",
            createdAt: "2025-08-21T14:32:00.000Z",
            updatedAt: "2025-08-21T15:10:00.000Z",
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
