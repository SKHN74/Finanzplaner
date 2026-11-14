import { plusMonate } from './dates'

export interface Zeitraum {
  start: Date
  /** Letzter Tag des Zeitraums (inklusive). */
  ende: Date
}

/**
 * Finanzmonat mit einstellbarem Beginn.
 * offset 0 = aktueller Finanzmonat, 1 = vorheriger, -1 = nächster.
 */
export function finanzmonat(stichtag: Date, monatsbeginn: number, offset = 0): Zeitraum {
  const tag = Math.min(Math.max(1, Math.round(monatsbeginn)), 28)
  let jahr = stichtag.getFullYear()
  let monat = stichtag.getMonth()
  if (stichtag.getDate() < tag) monat -= 1
  monat -= offset
  const start = new Date(jahr, monat, tag)
  jahr = start.getFullYear()
  const naechster = new Date(jahr, start.getMonth() + 1, tag)
  const ende = new Date(naechster.getFullYear(), naechster.getMonth(), naechster.getDate() - 1)
  return { start, ende }
}

export function imZeitraum(d: Date, z: Zeitraum): boolean {
  return d >= z.start && d <= z.ende
}

export { plusMonate }
