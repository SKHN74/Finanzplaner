import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBestand } from '../app/hooks'
import { einstellungenAendern } from '../db/repo'
import { formatEuro } from '../domain/money'
import type { Bestand } from '../domain/calc'
import { useEditor } from '../ui/editor'
import { PinFestlegen } from '../ui/Pin'
import { SCHRITTE } from '../ui/schritte'
import { Sheet } from '../ui/Sheet'
import { Eintrag, Leer } from '../ui/teile'

const TABELLE = { konto: 'konten', wiederkehrend: 'wiederkehrend', schuld: 'schulden', sparziel: 'sparziele' } as const

export function Einrichtung() {
  const b = useBestand()
  const nav = useNavigate()
  const oeffnen = useEditor()
  const [params, setParams] = useSearchParams()
  const [pinOffen, setPinOffen] = useState(false)
  const leer = b ? Object.keys(b.einstellungen.onboarding).length === 0 : false
  useEffect(() => {
    // Ab jetzt gilt die Einrichtung als begonnen; sie öffnet sich nicht mehr automatisch.
    if (leer) einstellungenAendern({ onboarding: { start: 'offen' } })
  }, [leer])
  if (!b) return null
  const i = Math.max(0, SCHRITTE.findIndex(s => s.key === (params.get('schritt') ?? 'start')))
  const s = SCHRITTE[i]
  const ob = b.einstellungen.onboarding
  const eintraege = s.typ ? ((b[TABELLE[s.typ as keyof typeof TABELLE] as keyof Bestand] as unknown as Record<string, unknown>[]).filter(s.filter!)) : []

  const weiter = () => (i + 1 < SCHRITTE.length ? setParams({ schritt: SCHRITTE[i + 1].key }) : nav('/'))
  async function fertig() { await einstellungenAendern({ onboarding: { ...ob, [s.key]: 'erledigt' } }); weiter() }
  async function spaeter() { if (ob[s.key] !== 'erledigt') await einstellungenAendern({ onboarding: { ...ob, [s.key]: 'uebersprungen' } }); weiter() }

  return (
    <>
      <div className="zeile"><span className="klein gedaempft">Schritt {i + 1} von {SCHRITTE.length}</span><button className="btn text" onClick={() => nav('/')}>Fertig für jetzt</button></div>
      <div className="schritte">
        {SCHRITTE.map((x, j) => (
          <button key={x.key} aria-label={`${x.titel}: ${ob[x.key] ?? 'offen'}`} className={j === i ? 'aktuell' : ob[x.key] === 'erledigt' ? 'erledigt' : ob[x.key] === 'uebersprungen' ? 'uebersprungen' : ''} onClick={() => setParams({ schritt: x.key })} />
        ))}
      </div>
      <h2 className="schritt-titel">{s.titel}</h2>
      <p className="gedaempft">{s.text}</p>

      {s.key === 'start' ? (
        <section className="karte">
          <label className="feld">
            <span>Mein Finanzmonat beginnt am</span>
            <select value={b.einstellungen.monatsbeginn} onChange={e => einstellungenAendern({ monatsbeginn: Number(e.target.value) })}>
              {Array.from({ length: 28 }, (_, j) => <option key={j} value={j + 1}>{j + 1}.{j === 0 ? ' (Kalendermonat)' : ''}</option>)}
            </select>
            <small>Kannst du jederzeit in den Einstellungen ändern.</small>
          </label>
          <div className="zeile"><span>PIN-Sperre</span>
            <button className="btn sek" onClick={() => setPinOffen(true)}>{b.einstellungen.pinAktiv ? 'PIN ändern' : 'PIN festlegen'}</button>
          </div>
        </section>
      ) : (
        <section className="karte liste">
          {eintraege.length === 0 && <Leer>Noch nichts eingetragen.</Leer>}
          {eintraege.map(x => (
            <Eintrag key={x.id as string} titel={x.name as string}
              rechts={<span className="betrag zahl">{formatEuro((x.anfangssaldo ?? x.betrag ?? x.restschuld ?? x.zielbetrag) as number)}</span>}
              onClick={() => oeffnen({ typ: s.typ!, id: x.id as string })} />
          ))}
          <button className="btn sek" onClick={() => oeffnen({ typ: s.typ!, vorgabe: s.vorgabe })}>+ Hinzufügen</button>
        </section>
      )}

      <section className="karte">
        <button className="btn" onClick={fertig}>{s.key === 'start' || eintraege.length ? 'Bereich vollständig · weiter' : 'Habe ich nicht · weiter'}</button>
        <button className="btn sek" onClick={spaeter}>Später ergänzen</button>
      </section>
      <p className="klein gedaempft">„Vollständig“ heißt: In diesem Bereich ist alles eingetragen. Erst dann gelten Berechnungen, die davon abhängen, als endgültig.</p>

      {pinOffen && (
        <Sheet titel="PIN festlegen" onSchliessen={() => setPinOffen(false)}>
          <PinFestlegen onFertig={async hash => { await einstellungenAendern({ pinAktiv: true, pinHash: hash }); setPinOffen(false) }} />
        </Sheet>
      )}
    </>
  )
}
