import { useBestand, useKategorien } from '../app/hooks'
import { uebersicht, variableAusgaben } from '../domain/calc'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { finanzmonat } from '../domain/period'
import { Balken, Leer } from '../ui/teile'

export function Analysen() {
  const b = useBestand()
  const kats = useKategorien()
  if (!b) return null
  const h = heute(), mb = b.einstellungen.monatsbeginn
  const u = uebersicht(b, h)
  const jeKat = kats.filter(k => k.art === 'ausgabe').map(k => ({ k, v: variableAusgaben(b.buchungen, h, mb, 0, k.id) })).filter(x => x.v > 0).sort((a, c) => c.v - a.v)
  const max = jeKat[0]?.v ?? 1
  const monate = [5, 4, 3, 2, 1, 0].map(o => ({ o, v: Math.max(0, variableAusgaben(b.buchungen, h, mb, o)), label: finanzmonat(h, mb, o).start.toLocaleDateString('de-DE', { month: 'short' }) }))
  const mmax = Math.max(1, ...monate.map(m => m.v))

  return (
    <>
      <section className="karte">
        <h2>Ausgaben nach Kategorie · dieser Monat</h2>
        {jeKat.length === 0 && <Leer>Noch keine Ausgaben in diesem Monat.</Leer>}
        {jeKat.map(({ k, v }) => (
          <div key={k.id} className="stapel"><span className="zeile klein"><span>{k.name}</span><span className="zahl">{formatEuro(v)}</span></span><Balken anteil={v / max} /></div>
        ))}
        <span className="klein gedaempft">Ohne gebuchte wiederkehrende Zahlungen wie Miete.</span>
      </section>
      <section className="karte">
        <h2>Variable Ausgaben je Monat</h2>
        {monate.every(m => m.v === 0) ? <Leer>Sobald du Ausgaben erfasst, erscheint hier der Verlauf.</Leer> : (
          <svg viewBox="0 0 300 150" className="diagramm" role="img" aria-label="Variable Ausgaben der letzten sechs Monate">
            <line x1="0" y1="120" x2="300" y2="120" stroke="var(--linie)" />
            {monate.map((m, i) => {
              const hh = (m.v / mmax) * 95, x = 10 + i * 48
              return (
                <g key={m.o}>
                  <rect x={x} y={120 - hh} width="34" height={hh} rx="5" fill={m.o === 0 ? 'var(--akzent)' : 'var(--akzent-weich)'} />
                  {m.v > 0 && <text x={x + 17} y={114 - hh} textAnchor="middle" fontSize="9" fill="var(--gedaempft)">{Math.round(m.v / 100)} €</text>}
                  <text x={x + 17} y="138" textAnchor="middle" fontSize="10" fill="var(--gedaempft)">{m.label}</text>
                </g>
              )
            })}
          </svg>
        )}
      </section>
      <section className="karte">
        <h2>Quoten</h2>
        {u.einnahmenMonat == null || u.einnahmenMonat === 0 ? <p className="fehlt">Quoten können erst berechnet werden, wenn deine Einnahmen eingetragen sind.</p> : (
          <>
            <div className="zeile"><span>Fixkostenquote</span><strong className="zahl">{Math.round((u.fixkostenMonat / u.einnahmenMonat) * 100)} %</strong></div>
            <Balken anteil={u.fixkostenMonat / u.einnahmenMonat} />
            <div className="zeile"><span>Geplante Sparquote</span><strong className="zahl">{Math.round((u.sparraten / u.einnahmenMonat) * 100)} %</strong></div>
            <Balken anteil={u.sparraten / u.einnahmenMonat} />
            {!u.fixkostenVollstaendig && <span className="pill warn selbst-start">vorläufig · Fixkosten unvollständig</span>}
          </>
        )}
      </section>
    </>
  )
}
