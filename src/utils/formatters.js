/**
 * Formats a number as GHS currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "GHS 150.00")
 */
export function formatCurrency(amount) {
  return `GHS ${amount.toFixed(2)}`;
}
