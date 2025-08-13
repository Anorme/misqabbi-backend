/**
 * Joi validation schema for Order creation/update.
 *
 * Fields:
 * - user: required, valid ObjectId string (references User)
 * - items: required, array of objects each containing:
 *     - product: required, valid ObjectId string (references Product)
 *     - quantity: required, number, min 1
 *     - price: required, number, min 0
 * - totalPrice: optional, number, min 0
 * - status: optional, string, one of ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], defaults to 'pending'
 */
