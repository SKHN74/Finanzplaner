import { DB_ECHT, DB_TEST, FinanzDB } from './schema'
import type { Datensatz } from '../domain/types'

const SCHLUESSEL = 'finanzplaner-modus'

function gespeicherterModus(): Datensatz {
  try {
    return localStorage.getItem(SCHLUESSEL) === 'test' ? 'test' : 'echt'
  } catch {
    return 'echt'
  }
}

let modus: Datensatz = gespeicherterModus()
let instanz: FinanzDB | null = null
const hoerer = new Set<() => void>()

export function aktuellerModus(): Datensatz {
  return modus
}

/** Die Datenbank des aktuellen Modus. Echte und Testdaten liegen in getrennten Datenbanken. */
export function db(): FinanzDB {
  if (!instanz) instanz = new FinanzDB(modus === 'test' ? DB_TEST : DB_ECHT)
  return instanz
}

export function setzeModus(neu: Datensatz): void {
  if (neu === modus) return
  instanz?.close()
  instanz = null
  modus = neu
  try { localStorage.setItem(SCHLUESSEL, neu) } catch { /* Speichern nicht möglich: Modus gilt bis zum Neuladen */ }
  hoerer.forEach(f => f())
}

export function beiModuswechsel(f: () => void): () => void {
  hoerer.add(f)
  return () => hoerer.delete(f)
}

/** Löscht ausschließlich die Test-Datenbank. Die echte Datenbank wird nie angefasst. */
export async function testdatenLoeschen(): Promise<void> {
  if (modus === 'test') instanz?.close()
  instanz = null
  await new FinanzDB(DB_TEST).delete()
}
