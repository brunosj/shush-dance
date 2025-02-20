export const formatCurrency = (
  amount: number | null | undefined,
  currency = 'EUR'
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€0.00';
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (
  number: number | null | undefined,
  decimals = 2
): string => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};
