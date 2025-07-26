// Utility functions for the shopping app

/**
 * Safely formats a price value to a fixed decimal string
 * Handles both string and number inputs
 */
export const formatPrice = (price: string | number, decimals: number = 2): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(decimals);
};

/**
 * Converts a price string to a number
 */
export const parsePrice = (price: string | number): number => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? 0 : numPrice;
};

/**
 * Formats currency with proper symbol
 */
export const formatCurrency = (price: string | number, currency: string = '₹'): string => {
  return `${currency}${formatPrice(price)}`;
};

/**
 * Safely formats a date string
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options,
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Truncates text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};