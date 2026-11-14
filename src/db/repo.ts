import { db, aktuellerModus } from './modus'
import { STANDARD_EINSTELLUNGEN, type Basis, type Einstellungen, type Schuld, type Wiederkehrend } from '../domain/types'
import type { Bestand } from '../domain/calc'
import { STANDARD_KATEGORIEN } from './kategorien'

type Tabelle = 'konten' | 'kategorien' | 'buchungen' | 'wiederkehrend' | 'schulden' | 'sparziele' | 'budgets'
type Neu<T extends Basis> = Omit<T, keyof Basis> & { id?: string }

export const neueId = () => crypto.randomUUID()

const TEST_PRAEFIX = '[TEST] '

/** Im Testmodus bekommt jeder Name das Präfix „[TEST]“, damit Testdaten immer erkennbar sind. */
function markieren<T extends object>(werte: T): T {
  if (aktuellerModus() !== 'test') return werte
  const w = { ...werte } as Record<string, unknown>
  for (const feld of ['name', 'notiz']) {
    const v = w[feld]
    if (typeof v === 'string' && !v.startsWith(TEST_PRAEFIX)) w[feld] = TEST_PRAEFIX + v
  }
  return w as T
}

export async function speichern<T extends Basis>(tabelle: Tabelle, werte: Neu<T> | T): Promise<string> {
  const jetzt = new Date().toISOString()
  const t = db()[tabelle] as unknown as import('dexie').Table<T, string>
  const id = werte.id ?? neueId()
  const vorhanden = await t.get(id)
  const datensatz = markieren({
    ...(vorhanden ?? {}),
    ...werte,
    id,
    erstelltAm: vorhanden?.erstelltAm ?? jetzt,
    geaendertAm: jetzt,
    datensatz: aktuellerModus(),
  }) as T
  await t.put(datensatz)
  if (tabelle === 'schulden') await rateSpiegeln(datensatz as unknown as Schuld)
  return id
}

export async function loeschen(tabelle: Tabelle, id: string): Promise<void> {
  await db().transaction('rw', db()[tabelle], db().wiederkehrend, db().schulden, async () => {
    if (tabelle === 'schulden') await db().wiederkehrend.where('schuldId').equals(id).delete()
    if (tabelle === 'wiederkehrend') {
      const w = await db().wiederkehrend.get(id)
      if (w?.schuldId) await db().schulden.update(w.schuldId, { rate: undefined })
    }
    await db()[tabelle].delete(id)
  })
}

/** Eine Schuld mit Rate erscheint automatisch als wiederkehrende Zahlung (Fixkosten). */
async function rateSpiegeln(s: Schuld): Promise<void> {
  const vorhanden = await db().wiederkehrend.where('schuldId').equals(s.id).first()
  if (!s.rate) {
    if (vorhanden) await db().wiederkehrend.delete(vorhanden.id)
    return
  }
  const jetzt = new Date().toISOString()
  const w: Wiederkehrend = {
    id: vorhanden?.id ?? neueId(),
    erstelltAm: vorhanden?.erstelltAm ?? jetzt,
    geaendertAm: jetzt,
    datensatz: s.datensatz,
    unterart: 'rate',
    intervall: 'monatlich',
    status: 'aktiv',
    kategorieId: 'kat-kredite',
    ...vorhanden,
    name: `${s.name} (Rate)`,
    betrag: s.rate,
    schuldId: s.id,
  }
  await db().wiederkehrend.put(w)
}

export async function einstellungen(): Promise<Einstellungen> {
  return (await db().einstellungen.get('einstellungen')) ?? STANDARD_EINSTELLUNGEN
}

export async function einstellungenAendern(aenderung: Partial<Omit<Einstellungen, 'id'>>): Promise<void> {
  const aktuell = await einstellungen()
  await db().einstellungen.put({ ...aktuell, ...aenderung, id: 'einstellungen' })
}

/** Legt Standardkategorien an, falls noch keine existieren. Enthält keine Beträge. */
export async function grundausstattung(): Promise<void> {
  if ((await db().kategorien.count()) > 0) return
  const jetzt = new Date().toISOString()
  await db().kategorien.bulkPut(STANDARD_KATEGORIEN.map(k => ({ ...k, erstelltAm: jetzt, geaendertAm: jetzt, datensatz: aktuellerModus() })))
}

export async function bestandLaden(): Promise<Bestand> {
  const d = db()
  const [konten, buchungen, wiederkehrend, schulden, sparziele, budgets, e] = await Promise.all([
    d.konten.toArray(), d.buchungen.toArray(), d.wiederkehrend.toArray(), d.schulden.toArray(),
    d.sparziele.toArray(), d.budgets.toArray(), einstellungen(),
  ])
  return { konten, buchungen, wiederkehrend, schulden, sparziele, budgets, einstellungen: e }
}
