import { useNavigate } from 'react-router-dom'
import { useBestand } from '../app/hooks'
import { hinweise, uebersicht, type Hinweis } from '../domain/calc'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { finanzmonat } from '../domain/period'
import { ONBOARDING_SCHRITTE } from '../domain/types'

export function Uebersicht() {
  const b = useBestand()
  const nav = useNavigate()
  if (!b) return null
  const h = heute()
  const u = uebersicht(b, h)
  const monat = finanzmonat(h, b.einstellungen.monatsbeginn).start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const erledigt = ONBOARDING_SCHRITTE.filter(s => b.einstellungen.onboarding[s] === 'erledigt').length
  const ziel = (x: Hinweis) => (x.ziel.art === 'onboarding' ? `/einrichtung?schritt=${x.ziel.schritt}` : x.ziel.art === 'neu' ? '/konten' : '/schulden')

  return (
    <>
      {erledigt < ONBOARDING_SCHRITTE.length && (
        <section className="karte">
          <div className="zeile"><h2>Einrichtung</h2><span className="pill">{erledigt} von {ONBOARDING_SCHRITTE.length}</span></div>
          <div className="balken"><i style={{ width: `${(erledigt / ONBOARDING_SCHRITTE.length) * 100}%` }} /></div>
          <button className="btn" onClick={() => nav('/einrichtung')}>{erledigt ? 'Einrichtung fortsetzen' : 'Einrichtung starten'}</button>
        </section>
      )}
      <section className="karte">
        <div className="zeile"><h2>Frei verfügbar · {monat}</h2>{u.vorlaeufig && <span className="pill warn">vorläufig</span>}</div>
        {u.freiVerfuegbar == null
          ? <p className="fehlt">Noch nicht berechenbar: Es fehlen deine monatlichen Einnahmen.</p>
          : <p className={`gross zahl ${u.freiVerfuegbar < 0 ? 'minus' : ''}`}>{formatEuro(u.freiVerfuegbar)}</p>}
      </section>
      {hinweise(b, h).length > 0 && (
        <section className="karte">
          <h2>Hinweise</h2>
          {hinweise(b, h).map(x => (
            <button key={x.text} className="hinweis" onClick={() => nav(ziel(x))}><b>!</b><span>{x.text}</span><span className="pfeil">›</span></button>
          ))}
        </section>
      )}
      <div className="raster2">
        <Kachel titel="Einnahmen / Monat" wert={u.einnahmenMonat} fehlt="fehlt" />
        <Kachel titel="Fixkosten / Monat" wert={u.fixkostenMonat} zusatz={u.fixkostenVollstaendig ? undefined : 'unvollständig'} />
        <Kachel titel="Vermögen (netto)" wert={u.vermoegen} fehlt="kein Konto" />
        <Kachel titel="Ausgaben bisher" wert={u.variableAusgaben} />
      </div>
    </>
  )
}

function Kachel({ titel, wert, fehlt, zusatz }: { titel: string; wert: number | null; fehlt?: string; zusatz?: string }) {
  return (
    <div className="kachel">
      <span className="lbl">{titel}</span>
      {wert == null ? <span className="fehlt">{fehlt}</span> : <span className="wert zahl">{formatEuro(wert)}</span>}
      {zusatz && <span className="fehlt">{zusatz}</span>}
    </div>
  )
}
