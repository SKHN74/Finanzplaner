import type { IsoDate } from './types'

export function toIso(d: Date): IsoDate {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromIso(s: IsoDate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function heute(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Addiert Monate und begrenzt den Tag auf das Monatsende (31.01. + 1 Monat = 28./29.02.). */
export function plusMonate(d: Date, n: number): Date {
  const ziel = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const letzter = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate()
  ziel.setDate(Math.min(d.getDate(), letzter))
  return ziel
}

export const datumKurz = (iso?: IsoDate) => (iso ? fromIso(iso).toLocaleDateString('de-DE') : '–')
