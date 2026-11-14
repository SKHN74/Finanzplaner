import { datumKurz } from '../domain/dates'
import { useState } from 'react'
import { useBestand } from '../app/hooks'
import { aufMonat, istAktiv } from '../domain/calc'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import type { Unterart } from '../domain/types'
import { useEditor } from '../ui/editor'
import { INTERVALL, STATUS, UNTERART } from '../ui/felder'
import { Eintrag, Leer } from '../ui/teile'

const FILTER: [Unterart | 'alle', string][] = [['alle', 'Alle'], ['einkommen', 'Einnahmen'], ['fixkosten', 'Fixkosten'], ['versicherung', 'Versicherungen'], ['abo', 'Abos'], ['vertrag', 'Verträge'], ['rate', 'Raten'], ['sonstiges', 'Sonstige']]

export function Vertraege() {
  const b = useBestand()
  const oeffnen = useEditor()
  const [filter, setFilter] = useState<Unterart | 'alle'>('alle')
  if (!b) return null
  const h = heute()
  const liste = b.wiederkehrend
    .filter(w => filter === 'alle' || w.unterart === filter)
    .sort((a, c) => Number(istAktiv(c, h)) - Number(istAktiv(a, h)) || a.name.localeCompare(c.name))
  const saldo = liste.filter(w => istAktiv(w, h)).reduce((a, w) => a + (w.unterart === 'einkommen' ? aufMonat(w) : -aufMonat(w)), 0)

  return (
    <>
      <div className="chips">
        {FILTER.map(([k, l]) => <button key={k} className={`chip ${filter === k ? 'an' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {liste.length > 0 && (
        <section className="karte"><div className="zeile"><span className="klein gedaempft">Aktiv, auf den Monat umgerechnet</span><strong className="zahl">{formatEuro(saldo)}</strong></div></section>
      )}
      <section className="karte liste">
        {liste.length === 0 && <Leer>Hier erscheinen Fixkosten, Versicherungen, Abos, Verträge, Raten und regelmäßige Einnahmen.</Leer>}
        {liste.map(w => (
          <Eintrag
            key={w.id}
            titel={w.name}
            gedimmt={!istAktiv(w, h)}
            unter={`${UNTERART[w.unterart]} · ${INTERVALL[w.intervall]}${w.status === 'gekuendigt' && w.laufzeitEnde ? ' · endet ' + datumKurz(w.laufzeitEnde) : ''}`}
            rechts={
              <span className="rechts">
                <span className={`betrag zahl ${w.unterart === 'einkommen' ? 'plus' : ''}`}>{formatEuro(w.betrag)}</span>
                <span className={`pill ${w.status === 'aktiv' ? 'ok' : w.status === 'gekuendigt' ? 'warn' : ''}`}>{STATUS[w.status]}</span>
              </span>
            }
            onClick={() => oeffnen({ typ: w.schuldId ? 'schuld' : 'wiederkehrend', id: w.schuldId ?? w.id })}
          />
        ))}
        <button className="btn sek" onClick={() => oeffnen({ typ: 'wiederkehrend', vorgabe: filter === 'alle' ? undefined : { unterart: filter } })}>+ Hinzufügen</button>
      </section>
    </>
  )
}
