import { useBestand } from '../app/hooks'
import { schuldenEnde } from '../domain/calc'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { useEditor } from '../ui/editor'
import { Balken, Leer } from '../ui/teile'

export function Schulden() {
  const b = useBestand()
  const oeffnen = useEditor()
  if (!b) return null
  const summe = b.schulden.reduce((a, s) => a + s.restschuld, 0)
  return (
    <>
      {b.schulden.length > 0 && <section className="karte"><h2>Restschuld gesamt</h2><p className="gross zahl">{formatEuro(summe)}</p></section>}
      <section className="karte liste">
        {b.schulden.length === 0 && <Leer>Keine Schulden eingetragen.</Leer>}
        {b.schulden.map(s => {
          const e = schuldenEnde(s, heute())
          const getilgt = s.ursprungsbetrag ? 1 - s.restschuld / s.ursprungsbetrag : null
          return (
            <button key={s.id} className="budgetzeile" onClick={() => oeffnen({ typ: 'schuld', id: s.id })}>
              <span className="zeile"><strong>{s.name}</strong><span className="zahl">{formatEuro(s.restschuld)}</span></span>
              {getilgt != null && <><Balken anteil={getilgt} /><span className="klein gedaempft">{Math.round(getilgt * 100)} % getilgt</span></>}
              <span className="klein">{[s.rate && `Rate ${formatEuro(s.rate)}`, s.zinssatz != null && `${String(s.zinssatz).replace('.', ',')} % p. a.`].filter(Boolean).join(' · ')}</span>
              <span className={`klein ${e.art === 'datum' ? 'gedaempft' : 'fehlt'}`}>
                {e.art === 'datum' ? `Voraussichtlich schuldenfrei: ${e.datum.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })} (${e.raten} Raten)`
                  : e.art === 'nie' ? 'Die Rate deckt die Zinsen nicht. Die Schuld wird nicht kleiner.'
                  : `Ergänze ${e.feld === 'rate' ? 'die Rate' : 'den Zinssatz'}, um das Enddatum zu berechnen.`}
              </span>
            </button>
          )
        })}
        <button className="btn sek" onClick={() => oeffnen({ typ: 'schuld' })}>+ Schuld hinzufügen</button>
      </section>
    </>
  )
}
