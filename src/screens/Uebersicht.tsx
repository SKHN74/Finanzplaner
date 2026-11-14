import { datumKurz } from '../domain/dates'
import { useNavigate } from 'react-router-dom'
import { useBestand } from '../app/hooks'
import { faelligeZahlungen, hinweise, istAktiv, naechsteFaelligkeit, uebersicht, variableAusgaben, type Hinweis } from '../domain/calc'
import { faelligkeitUeberspringen, zahlungBuchen } from '../db/aktionen'
import { useEditor } from '../ui/editor'
import { UNTERART } from '../ui/felder'
import { Balken, Eintrag } from '../ui/teile'
import { useKategorien } from '../app/hooks'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { finanzmonat } from '../domain/period'
import { ONBOARDING_SCHRITTE } from '../domain/types'

export function Uebersicht() {
  const b = useBestand()
  const nav = useNavigate()
  const oeffnen = useEditor()
  const kats = useKategorien()
  if (!b) return null
  const h = heute()
  const u = uebersicht(b, h)
  const monat = finanzmonat(h, b.einstellungen.monatsbeginn).start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const erledigt = ONBOARDING_SCHRITTE.filter(s => b.einstellungen.onboarding[s] === 'erledigt').length
  const faellig = faelligeZahlungen(b.wiederkehrend, h)
  const naechste = b.wiederkehrend.filter(w => istAktiv(w, h) && !faellig.includes(w))
    .map(w => [w, naechsteFaelligkeit(w, h)] as const).filter((x): x is readonly [typeof x[0], Date] => !!x[1])
    .sort((a, c) => a[1].getTime() - c[1].getTime()).slice(0, 5)
  const ziel = (x: Hinweis) => (x.ziel.art === 'onboarding' ? `/einrichtung?schritt=${x.ziel.schritt}` : x.ziel.art === 'neu' ? '/einrichtung?schritt=hauptkonto' : '/schulden')

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
          : <>
              <p className={`gross zahl ${u.freiVerfuegbar < 0 ? 'minus' : ''}`}>{formatEuro(u.freiVerfuegbar)}</p>
              <p className="klein gedaempft zahl">{formatEuro(u.einnahmenMonat)} Einnahmen − {formatEuro(u.fixkostenMonat)} Fixkosten − {formatEuro(u.sparraten)} Sparraten − {formatEuro(u.variableAusgaben)} bisherige Ausgaben</p>
            </>}
      </section>
      {hinweise(b, h).length > 0 && (
        <section className="karte">
          <h2>Hinweise</h2>
          {hinweise(b, h).map(x => (
            <button key={x.text} className="hinweis" onClick={() => nav(ziel(x))}><b>!</b><span>{x.text}</span><span className="pfeil">›</span></button>
          ))}
        </section>
      )}
      {faellig.length > 0 && (
        <section className="karte liste">
          <h2>Fällige Zahlungen</h2>
          <p className="klein gedaempft">Bestätige, wenn die Zahlung erfolgt ist. Sie wird dann als Buchung erfasst.</p>
          {faellig.map(w => (
            <div key={w.id} className="faellig">
              <Eintrag titel={w.name} unter={`${datumKurz(w.naechsteFaelligkeit)} · ${UNTERART[w.unterart]}`} rechts={<span className={`betrag zahl ${w.unterart === 'einkommen' ? 'plus' : ''}`}>{formatEuro(w.betrag)}</span>} onClick={() => oeffnen({ typ: 'wiederkehrend', id: w.id })} />
              <div className="aktionen">
                <button className="btn sek" onClick={() => faelligkeitUeberspringen(w)}>Überspringen</button>
                <button className="btn" onClick={() => zahlungBuchen(w)}>Buchen</button>
              </div>
            </div>
          ))}
        </section>
      )}
      <div className="raster2">
        <Kachel titel="Einnahmen / Monat" wert={u.einnahmenMonat} fehlt="fehlt" />
        <Kachel titel="Fixkosten / Monat" wert={u.fixkostenMonat} zusatz={u.fixkostenVollstaendig ? undefined : 'unvollständig'} />
        <Kachel titel="Vermögen (netto)" wert={u.vermoegen} fehlt="kein Konto" />
        <Kachel titel="Ausgaben bisher" wert={u.variableAusgaben} />
      </div>
      {b.budgets.length > 0 && (
        <section className="karte">
          <div className="zeile"><h2>Budget</h2><button className="btn text" onClick={() => nav('/budget')}>Alle</button></div>
          {b.budgets.slice(0, 4).map(x => {
            const ist = variableAusgaben(b.buchungen, h, b.einstellungen.monatsbeginn, 0, x.kategorieId)
            return (
              <div key={x.id} className="stapel">
                <span className="zeile klein"><span>{kats.find(k => k.id === x.kategorieId)?.name}</span><span className="zahl">{formatEuro(ist)} / {formatEuro(x.betrag)}</span></span>
                <Balken anteil={x.betrag ? ist / x.betrag : 1} ueber={ist > x.betrag} />
              </div>
            )
          })}
        </section>
      )}
      <section className="karte liste">
        <h2>Nächste Zahlungen</h2>
        {naechste.length === 0 && <p className="klein gedaempft">Noch keine wiederkehrenden Zahlungen mit Fälligkeitsdatum.</p>}
        {naechste.map(([w, d]) => (
          <Eintrag key={w.id} titel={w.name} unter={`${d.toLocaleDateString('de-DE')} · ${UNTERART[w.unterart]}`}
            rechts={<span className={`betrag zahl ${w.unterart === 'einkommen' ? 'plus' : ''}`}>{w.unterart === 'einkommen' ? '+' : '−'}{formatEuro(w.betrag)}</span>}
            onClick={() => oeffnen({ typ: 'wiederkehrend', id: w.id })} />
        ))}
      </section>
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
