import { useEffect, useState } from 'react'
import { useKategorien, useModus } from '../app/hooks'
import { db } from '../db/modus'
import { loeschen, speichern } from '../db/repo'
import { toIso, heute } from '../domain/dates'
import { centZuEingabe, parseEuro } from '../domain/money'
import type { Budget, Sparziel } from '../domain/types'
import type { EditorAufruf } from './editor'
import { SCHEMA, type Feld } from './felder'
import { Sheet } from './Sheet'
import { useLiveQuery } from 'dexie-react-hooks'

type Werte = Record<string, string>

const STANDARD: Partial<Record<string, Werte>> = {
  konto: { typ: 'giro', saldoStichtag: toIso(heute()) },
  buchung: { art: 'ausgabe', datum: toIso(heute()) },
  wiederkehrend: { unterart: 'fixkosten', intervall: 'monatlich', status: 'aktiv' },
}

function zuText(f: Feld, v: unknown): string {
  if (v == null) return ''
  if (f.t === 'money') return centZuEingabe(v as number)
  if (f.t === 'number') return String(v).replace('.', ',')
  return String(v)
}

export function EditorHost({ aufruf, onSchliessen }: { aufruf: EditorAufruf; onSchliessen: () => void }) {
  const { typ, id, vorgabe } = aufruf
  const schema = SCHEMA[typ]
  const kategorien = useKategorien()
  const konten = useLiveQuery(() => db().konten.toArray(), [useModus()]) ?? []
  const [werte, setWerte] = useState<Werte | null>(null)
  const [fehler, setFehler] = useState('')
  const [bestaetigen, setBestaetigen] = useState(false)
  const [vorhanden, setVorhanden] = useState(false)

  useEffect(() => {
    (async () => {
      let datensatz: Record<string, unknown> | undefined
      if (typ === 'budget' && id) datensatz = await db().budgets.where('kategorieId').equals(id).first() as never
      else if (typ !== 'einzahlung' && id && schema.tabelle) datensatz = await db().table(schema.tabelle).get(id)
      setVorhanden(!!datensatz && typ !== 'budget')
      const w: Werte = { ...STANDARD[typ], ...vorgabe }
      if (typ === 'buchung' && !w.kontoId) {
        const erstes = await db().konten.toCollection().first()
        if (erstes) w.kontoId = erstes.id
      }
      if (datensatz) for (const f of schema.felder) w[f.k] = zuText(f, datensatz[f.k])
      setWerte(w)
    })()
  }, [typ, id, vorgabe, schema])

  if (!werte) return null
  const sichtbar = schema.felder.filter(f => !f.wenn || f.wenn(werte))
  const kontext = { kategorien, konten }
  const titel = typ === 'budget' ? `Budget · ${kategorien.find(k => k.id === id)?.name ?? ''}`
    : typ === 'einzahlung' ? 'Einzahlen' : `${schema.titel} ${vorhanden ? 'bearbeiten' : 'hinzufügen'}`

  async function sichern(e: React.FormEvent) {
    e.preventDefault()
    const daten: Record<string, unknown> = {}
    for (const f of sichtbar) {
      const roh = (werte![f.k] ?? '').trim()
      if (f.pflicht && !roh) return setFehler(`Bitte „${f.l}“ ausfüllen.`)
      if (f.t === 'money') {
        const c = parseEuro(roh)
        if (Number.isNaN(c)) return setFehler(`„${f.l}“ ist kein gültiger Betrag.`)
        daten[f.k] = c ?? undefined
      } else if (f.t === 'number') {
        const n = roh ? Number(roh.replace(',', '.')) : undefined
        if (n !== undefined && Number.isNaN(n)) return setFehler(`„${f.l}“ ist keine gültige Zahl.`)
        daten[f.k] = n
      } else daten[f.k] = roh || undefined
    }
    for (const f of schema.felder) if (!sichtbar.includes(f)) daten[f.k] = undefined
    if (typ === 'buchung' && daten.art === 'umbuchung' && (!daten.kontoId || !daten.zielKontoId || daten.kontoId === daten.zielKontoId)) {
      return setFehler('Für eine Umbuchung brauchst du zwei verschiedene Konten.')
    }
    if (typ === 'buchung' && (daten.betrag as number) <= 0) return setFehler('Der Betrag muss größer als 0 sein.')

    if (typ === 'budget') {
      const b = await db().budgets.where('kategorieId').equals(id!).first()
      if (daten.betrag == null) { if (b) await loeschen('budgets', b.id) }
      else await speichern<Budget>('budgets', { id: b?.id, kategorieId: id!, betrag: daten.betrag as number })
    } else if (typ === 'einzahlung') {
      const z = await db().sparziele.get(id!)
      if (z) await speichern<Sparziel>('sparziele', { ...z, eingezahlt: z.eingezahlt + (daten.betrag as number) })
    } else {
      if (typ === 'sparziel' && daten.eingezahlt == null) daten.eingezahlt = 0
      if (typ === 'konto') daten.aktiv = true
      await speichern(schema.tabelle as never, { ...daten, id } as never)
    }
    onSchliessen()
  }

  async function entfernen() {
    if (!bestaetigen) return setBestaetigen(true)
    await loeschen(schema.tabelle as never, id!)
    onSchliessen()
  }

  return (
    <Sheet titel={titel} onSchliessen={onSchliessen}>
      <form className="formular" onSubmit={sichern} noValidate>
        {sichtbar.map(f => (
          <label key={f.k} className="feld">
            <span>{f.l}{f.pflicht ? ' *' : ''}</span>
            {f.t === 'select' ? (
              <select id={`f-${f.k}`} value={werte[f.k] ?? ''} onChange={e => setWerte({ ...werte, [f.k]: e.target.value })}>
                {f.leer && <option value="">{f.leer}</option>}
                {f.optionen!(kontext).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <input
                id={`f-${f.k}`}
                type={f.t === 'date' ? 'date' : 'text'}
                inputMode={f.t === 'money' || f.t === 'number' ? 'decimal' : undefined}
                placeholder={f.t === 'money' ? '0,00 €' : f.platzhalter}
                value={werte[f.k] ?? ''}
                onChange={e => setWerte({ ...werte, [f.k]: e.target.value })}
              />
            )}
            {f.hilfe && <small>{f.hilfe}</small>}
          </label>
        ))}
        {fehler && <p className="fehler" role="alert">{fehler}</p>}
        <div className="aktionen">
          <button type="button" className="btn sek" onClick={onSchliessen}>Abbrechen</button>
          <button type="submit" className="btn">Speichern</button>
        </div>
        {vorhanden && (
          <button type="button" className="btn gefahr" onClick={entfernen}>{bestaetigen ? 'Wirklich löschen? Nochmal tippen' : 'Löschen'}</button>
        )}
      </form>
    </Sheet>
  )
}
