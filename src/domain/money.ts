import type { Cent } from './types'

const format = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export function formatEuro(c: Cent | null | undefined): string {
  return c == null ? '–' : format.format(c / 100)
}

/**
 * Liest eine deutsche Betragseingabe („1.234,56“, „12,5“, „12“) als Cent.
 * Leere Eingabe → null, ungültige Eingabe → NaN.
 */
export function parseEuro(input: string): Cent | null {
  const s = input.trim().replace(/\s|€/g, '')
  if (s === '') return null
  if (!/^-?[\d.]*(,\d{0,2})?$/.test(s)) return NaN
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}

export function centZuEingabe(c: Cent | null | undefined): string {
  return c == null ? '' : (c / 100).toFixed(2).replace('.', ',')
}
