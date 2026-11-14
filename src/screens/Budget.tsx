import { Link } from 'react-router-dom'
import { useBestand, useKategorien } from '../app/hooks'
import { uebersicht, variableAusgaben } from '../domain/calc'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { useEditor } from '../ui/editor'
import { Balken, Leer } from '../ui/teile'

const OHNE_BUDGET = ['kat-versicherungen', 'kat-abos', 'kat-kredite']

export function Budget() {
  const b = useBestand()
  const kats = useKategorien()
  const oeffnen = useEditor()
  if (!b) return null
  const h = heute()
  const u = uebersicht(b, h)
  const summe = b.budgets.reduce((a, x) => a + x.betrag, 0)
  const ausgaben = kats.filter(k => k.art === 'ausgabe' && !OHNE_BUDGET.includes(k.id))
  const ist = (id: string) => variableAusgaben(b.buchungen, h, b.einstellungen.monatsbeginn, 0, id)
  const plan = (id: string) => b.budgets.find(x => x.kategorieId === id)?.betrag
  const aktiv = ausgaben.filter(k => plan(k.id) != null || ist(k.id) > 0)
  const rest = ausgaben.filter(k => !aktiv.includes(k))

  return (
    <>
      <section className="karte">
        <h2>Diesen Monat</h2>
        {u.einnahmenMonat == null ? (
          <>
            <p className="fehlt">Dein Budget kann noch nicht vollständig berechnet werden. Füge deine monatlichen Einnahmen hinzu.</p>
            <Link className="btn sek" to="/einrichtung?schritt=einnahmen">Einnahmen eintragen</Link>
          </>
        ) : (
          <>
            <div className="zeile"><span>Nach Fixkosten und Sparraten</span><strong className="zahl">{formatEuro(u.einnahmenMonat - u.fixkostenMonat - u.sparraten)}</strong></div>
            <div className="zeile"><span>Davon budgetiert</span><span className="zahl">{formatEuro(summe)}</span></div>
            <div className="zeile"><span>Nicht verplant</span><strong className="zahl">{formatEuro(u.einnahmenMonat - u.fixkostenMonat - u.sparraten - summe)}</strong></div>
            {!u.fixkostenVollstaendig && <span className="pill warn selbst-start">vorläufig · Fixkosten unvollständig</span>}
          </>
        )}
      </section>
      <section className="karte liste">
        <h2>Kategorien</h2>
        {aktiv.length === 0 && <Leer>Noch keine Budgets. Wähle unten eine Kategorie.</Leer>}
        {aktiv.map(k => {
          const p = plan(k.id), s = ist(k.id)
          return (
            <button key={k.id} className="budgetzeile" onClick={() => oeffnen({ typ: 'budget', id: k.id })}>
              <span className="zeile"><span>{k.name}</span><span className="zahl klein">{formatEuro(s)}{p != null && ` / ${formatEuro(p)}`}</span></span>
              {p != null ? (
                <>
                  <Balken anteil={p ? s / p : 1} ueber={s > p} />
                  <span className={`klein ${s > p ? 'minus' : 'gedaempft'}`}>{s > p ? `Überzogen um ${formatEuro(s - p)}` : `Noch ${formatEuro(p - s)} übrig`}</span>
                </>
              ) : <span className="klein gedaempft">Kein Budget gesetzt · antippen zum Festlegen</span>}
            </button>
          )
        })}
      </section>
      {rest.length > 0 && (
        <section className="karte">
          <h2>Budget hinzufügen</h2>
          <div className="chips umbruch">
            {rest.map(k => <button key={k.id} className="chip" onClick={() => oeffnen({ typ: 'budget', id: k.id })}>+ {k.name}</button>)}
          </div>
        </section>
      )}
    </>
  )
}
