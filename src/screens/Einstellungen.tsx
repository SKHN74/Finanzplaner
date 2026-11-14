import { useState } from 'react'
import { useBestand, useModus } from '../app/hooks'
import { setzeModus, testdatenLoeschen } from '../db/modus'
import { einstellungenAendern, grundausstattung } from '../db/repo'
import { testdatenErzeugen } from '../testdata/generieren'

export function Einstellungen() {
  const b = useBestand()
  const modus = useModus()
  const [bestaetigen, setBestaetigen] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  if (!b) return null

  async function wechseln() {
    setBestaetigen(false)
    setzeModus(modus === 'test' ? 'echt' : 'test')
    await grundausstattung()
  }
  async function erzeugen() {
    setLaeuft(true)
    await testdatenLoeschen(); await testdatenErzeugen()
    setLaeuft(false)
  }
  async function loeschen() {
    if (!bestaetigen) return setBestaetigen(true)
    await testdatenLoeschen(); await grundausstattung(); setBestaetigen(false)
  }

  return (
    <>
      <section className="karte">
        <h2>Finanzmonat</h2>
        <label className="feld">
          <span>Monat beginnt am</span>
          <select id="monatsbeginn" value={b.einstellungen.monatsbeginn} onChange={e => einstellungenAendern({ monatsbeginn: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i} value={i + 1}>{i + 1}. des Monats{i === 0 ? ' (Kalendermonat)' : ''}</option>
            ))}
          </select>
          <small>Zum Beispiel dein Gehaltstag. Budgets und Auswertungen richten sich danach.</small>
        </label>
      </section>
      <section className="karte">
        <h2>Testmodus</h2>
        <p className="klein gedaempft">Testdaten liegen in einer eigenen Datenbank und berühren deine echten Daten nie.</p>
        <div className="zeile">
          <span>{modus === 'test' ? 'Testmodus ist aktiv' : 'Echte Daten sind aktiv'}</span>
          <button className="btn sek" onClick={wechseln}>{modus === 'test' ? 'Zu echten Daten' : 'Zum Testmodus'}</button>
        </div>
        {modus === 'test' && (
          <div className="aktionen">
            <button className="btn sek" disabled={laeuft} onClick={erzeugen}>{laeuft ? 'Wird erzeugt …' : 'Testdaten erzeugen'}</button>
            <button className="btn gefahr" onClick={loeschen}>{bestaetigen ? 'Wirklich alle Testdaten löschen?' : 'Testdaten löschen'}</button>
          </div>
        )}
      </section>
    </>
  )
}
