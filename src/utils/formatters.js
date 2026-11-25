/**
 * Formatting helpers for currency, dates, tags, and strings.
 */

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function formatPrice(num, currency = '₹') {
  if (typeof num === 'string' && num.includes('₹')) return num;
  return `${currency}${Number(num || 0).toLocaleString('en-IN')}`;
}

export function truncate(str, max = 140) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}
