/**
 * Utility functions for formatting dates and monetary values.
 * These helpers are used across the admin dashboard and other components.
 */

/**
 * Safely format a date/time value using the Intl.DateTimeFormat API.
 * Accepts a wide range of input types to accommodate legacy code and TypeScript
 * mismatches: Date, string, number, null/undefined, or arrays containing any of
 * those. If the input cannot be parsed, an empty string is returned.
 */
export function formatDateTime(
  date: unknown,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  // Resolve arrays GÇô use the first element.
  if (Array.isArray(date)) {
    date = date[0];
  }

  if (date == null) return '';

  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
    if (isNaN(d.getTime())) return '';
  } else {
    return '';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const fmt = new Intl.DateTimeFormat(locale, options ?? defaultOptions);
  return fmt.format(d);
}

/**
 * Safely format a numeric amount as a localized currency string.
 * Accepts number, string, null/undefined, or arrays containing a number.
 */
export function formatMoney(
  amount: unknown,
  currency: string = 'USD',
  locale?: string
): string {
  if (Array.isArray(amount)) {
    amount = amount[0];
  }
  if (amount == null) return '';
  const num = Number(amount);
  if (Number.isNaN(num)) return '';
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return fmt.format(num);
}

/**
 * Compatibility wrapper for legacy imports expecting `formatVerifiedDate`.
 * It forwards to `formatDateTime`.
 */
export function formatVerifiedDate(
  date: unknown,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatDateTime(date, locale, options);
}
