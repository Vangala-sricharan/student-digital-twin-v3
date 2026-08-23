/**
 * Formats a number according to the Indian Numbering System with the ₹ symbol.
 * Example: 299 -> ₹299, 1499 -> ₹1,499, 12999 -> ₹12,999, 100000 -> ₹1,00,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Convert to integer string for standard INR grouping
  const parts = absAmount.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1].slice(0, 2)}` : '';
  
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = `${formattedOther},${lastThree}`;
  }
  
  return `${isNegative ? '-' : ''}₹${integerPart}${decimalPart}`;
}
