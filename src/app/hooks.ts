import { useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { aktuellerModus, beiModuswechsel } from '../db/modus'
import { bestandLaden } from '../db/repo'
import { db } from '../db/modus'

export function useModus() {
  return useSyncExternalStore(beiModuswechsel, aktuellerModus)
}

/** Lädt alle Daten des aktuellen Modus und aktualisiert sich bei jeder Änderung automatisch. */
export function useBestand() {
  const modus = useModus()
  return useLiveQuery(() => bestandLaden(), [modus])
}

export function useKategorien() {
  const modus = useModus()
  return useLiveQuery(() => db().kategorien.toArray(), [modus]) ?? []
}
