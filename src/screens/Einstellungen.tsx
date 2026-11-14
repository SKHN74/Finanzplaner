import { useRef, useState } from 'react'
import { useBestand, useModus } from '../app/hooks'
import { sicherungEinspielen, sicherungErstellen, sicherungPruefen, type Sicherung } from '../db/aktionen'
import { setzeModus, testdatenLoeschen } from '../db/modus'
import { einstellungenAendern, grundausstattung } from '../db/repo'
import { testdatenErzeugen } from '../testdata/generieren'
import { PinFestlegen } from '../ui/Pin'
import { Sheet } from '../ui/Sheet'

export function Einstellungen() {
  const b = useBestand()
  const modus = useModus()
  const [bestaetigen, setBestaetigen] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [pinOffen, setPinOffen] = useState(false)
  const [import_, setImport] = useState<Sicherung | null>(null)
  const [meldung, setMeldung] = useState('')
  const datei = useRef<HTMLInputElement>(null)
  if (!b) return null

  async function wechseln() {
    setBestaetigen(null)
    setzeModus(modus === 'test' ? 'echt' : 'test')
    await grundausstattung()
  }
  async function erzeugen() {
    setLaeuft(true)
    await testdatenLoeschen(); await testdatenErzeugen()
    setLaeuft(false)
  }
  async function loeschen() {
    if (bestaetigen !== 'test') return setBestaetigen('test')
    await testdatenLoeschen(); await grundausstattung(); setBestaetigen(null)
  }
  async function exportieren() {
    const s = await sicherungErstellen()
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `finanzplaner-${modus === 'test' ? 'TESTDATEN-' : ''}sicherung-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    await einstellungenAendern({ letzteSicherung: new Date().toISOString() })
  }
  async function dateiGewaehlt(f?: File) {
    setMeldung('')
    if (!f) return
    try {
      const s = JSON.parse(await f.text())
      if (!sicherungPruefen(s)) throw new Error()
      if (s.modus !== modus) return setMeldung(s.modus === 'test' ? 'Diese Datei enthält Testdaten. Wechsle zuerst in den Testmodus.' : 'Diese Datei enthält echte Daten. Wechsle zuerst zu den echten Daten.')
      setImport(s)
    } catch {
      setMeldung('Die Datei ist keine gültige Finanzplaner-Sicherung.')
    } finally {
      if (datei.current) datei.current.value = ''
    }
  }
  async function pinAus() {
    if (bestaetigen !== 'pin') return setBestaetigen('pin')
    await einstellungenAendern({ pinAktiv: false, pinHash: undefined }); setBestaetigen(null)
  }

  const letzte = b.einstellungen.letzteSicherung
  return (
    <>
      <section className="karte">
        <h2>Finanzmonat</h2>
        <label className="feld">
          <span>Monat beginnt am</span>
          <select id="monatsbeginn" value={b.einstellungen.monatsbeginn} onChange={e => einstellungenAendern({ monatsbeginn: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => <option key={i} value={i + 1}>{i + 1}. des Monats{i === 0 ? ' (Kalendermonat)' : ''}</option>)}
          </select>
          <small>Zum Beispiel dein Gehaltstag. Budgets und Auswertungen richten sich danach.</small>
        </label>
      </section>

      <section className="karte">
        <h2>Sicherheit</h2>
        <div className="zeile"><span>PIN-Sperre</span><span className={`pill ${b.einstellungen.pinAktiv ? 'ok' : ''}`}>{b.einstellungen.pinAktiv ? 'an' : 'aus'}</span></div>
        <div className="aktionen">
          <button className="btn sek" onClick={() => setPinOffen(true)}>{b.einstellungen.pinAktiv ? 'PIN ändern' : 'PIN festlegen'}</button>
          {b.einstellungen.pinAktiv && <button className="btn gefahr" onClick={pinAus}>{bestaetigen === 'pin' ? 'Wirklich ausschalten?' : 'PIN ausschalten'}</button>}
        </div>
        <div className="zeile"><span>Design</span><span className="gedaempft">Automatisch (Systemeinstellung)</span></div>
      </section>

      <section className="karte">
        <h2>Datensicherung</h2>
        <p className="klein gedaempft">Deine Daten liegen nur auf diesem Gerät. Speichere regelmäßig eine Sicherung, zum Beispiel in iCloud Drive. {letzte ? `Letzte Sicherung: ${new Date(letzte).toLocaleDateString('de-DE')}.` : 'Noch keine Sicherung erstellt.'}</p>
        <div className="aktionen">
          <button className="btn sek" onClick={exportieren}>Sicherung speichern</button>
          <button className="btn sek" onClick={() => datei.current?.click()}>Sicherung laden</button>
        </div>
        <input ref={datei} type="file" accept="application/json,.json" hidden onChange={e => dateiGewaehlt(e.target.files?.[0])} />
        {meldung && <p className="fehler" role="alert">{meldung}</p>}
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
            <button className="btn sek" disabled={laeuft} onClick={erzeugen}>{laeuft ? 'Wird erzeugt …' : 'Testdaten neu erzeugen'}</button>
            <button className="btn gefahr" onClick={loeschen}>{bestaetigen === 'test' ? 'Wirklich alle Testdaten löschen?' : 'Testdaten löschen'}</button>
          </div>
        )}
      </section>

      {pinOffen && (
        <Sheet titel="PIN festlegen" onSchliessen={() => setPinOffen(false)}>
          <PinFestlegen onFertig={async hash => { await einstellungenAendern({ pinAktiv: true, pinHash: hash }); setPinOffen(false) }} />
        </Sheet>
      )}
      {import_ && (
        <Sheet titel="Sicherung laden" onSchliessen={() => setImport(null)}>
          <p>Sicherung vom {new Date(import_.erstellt).toLocaleString('de-DE')} mit {import_.daten.buchungen.length} Buchungen und {import_.daten.konten.length} Konten.</p>
          <p className="fehlt">Alle aktuellen {modus === 'test' ? 'Testdaten' : 'Daten'} auf diesem Gerät werden dabei ersetzt.</p>
          <div className="aktionen">
            <button className="btn sek" onClick={() => setImport(null)}>Abbrechen</button>
            <button className="btn gefahr" onClick={async () => { await sicherungEinspielen(import_); setImport(null); setMeldung('') }}>Ersetzen und laden</button>
          </div>
        </Sheet>
      )}
    </>
  )
}

