/**
 * Money crosses the wire as integer cents. These convert to and from the
 * major-unit string an admin actually types, so no other component has to
 * think about the factor of 100 — or reach for a float.
 */

/** 690000 → "6900", 123456 → "1234.56" */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  const whole = Math.trunc(Math.abs(cents) / 100)
  const rest = Math.abs(cents) % 100
  const sign = cents < 0 ? '-' : ''
  return rest === 0 ? `${sign}${whole}` : `${sign}${whole}.${String(rest).padStart(2, '0')}`
}

/** "6,900" / "6900.50" → cents. Returns null for anything unparseable. */
export function inputToCents(value: string): number | null {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(/,/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? Math.round(amount * 100) : null
}

/** Display cents in the viewer's locale, e.g. 690000 → "€6,900". */
export function formatCents(
  cents: number | null | undefined,
  lang: 'en' | 'el' = 'en',
  currency = 'EUR',
): string {
  if (cents === null || cents === undefined) return '—'
  return new Intl.NumberFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}
