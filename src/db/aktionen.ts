import { db, aktuellerModus } from './modus'
import { speichern } from './repo'
import { TABELLEN } from './schema'
import { folgetermin } from '../domain/calc'
import { fromIso, toIso } from '../domain/dates'
import type { Buchung, Wiederkehrend } from '../domain/types'

/** Bucht eine fällige wiederkehrende Zahlung und setzt die nächste Fälligkeit ein Intervall weiter. */
export async function zahlungBuchen(w: Wiederkehrend): Promise<void> {
  if (!w.naechsteFaelligkeit) return
  await speichern<Buchung>('buchungen', {
    datum: w.naechsteFaelligkeit,
    art: w.unterart === 'einkommen' ? 'einnahme' : 'ausgabe',
    betrag: w.betrag,
    kontoId: w.kontoId,
    kategorieId: w.kategorieId,
    notiz: w.name,
    wiederkehrendId: w.id,
  })
  await db().wiederkehrend.update(w.id, {
    naechsteFaelligkeit: toIso(folgetermin(fromIso(w.naechsteFaelligkeit), w.intervall)),
    geaendertAm: new Date().toISOString(),
  })
}

/** Überspringt eine Fälligkeit, ohne zu buchen (z. B. wenn sie schon manuell erfasst wurde). */
export async function faelligkeitUeberspringen(w: Wiederkehrend): Promise<void> {
  if (!w.naechsteFaelligkeit) return
  await db().wiederkehrend.update(w.id, { naechsteFaelligkeit: toIso(folgetermin(fromIso(w.naechsteFaelligkeit), w.intervall)) })
}

export async function pinHash(pin: string): Promise<string> {
  const daten = new TextEncoder().encode('finanzplaner:' + pin)
  const hash = await crypto.subtle.digest('SHA-256', daten)
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
}

export interface Sicherung {
  app: 'finanzplaner'
  version: 1
  erstellt: string
  modus: 'echt' | 'test'
  daten: Record<(typeof TABELLEN)[number], unknown[]>
}

export async function sicherungErstellen(): Promise<Sicherung> {
  const daten = {} as Sicherung['daten']
  for (const t of TABELLEN) daten[t] = await db().table(t).toArray()
  return { app: 'finanzplaner', version: 1, erstellt: new Date().toISOString(), modus: aktuellerModus(), daten }
}

export function sicherungPruefen(x: unknown): x is Sicherung {
  const s = x as Sicherung
  return !!s && s.app === 'finanzplaner' && s.version === 1 && typeof s.daten === 'object' && TABELLEN.every(t => Array.isArray(s.daten[t]))
}

/** Ersetzt alle Daten des aktuellen Modus durch die Sicherung. */
export async function sicherungEinspielen(s: Sicherung): Promise<void> {
  const d = db()
  await d.transaction('rw', TABELLEN.map(t => d.table(t)), async () => {
    for (const t of TABELLEN) {
      await d.table(t).clear()
      await d.table(t).bulkPut(s.daten[t])
    }
  })
}
