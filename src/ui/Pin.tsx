import { useState } from 'react'
import { pinHash } from '../db/aktionen'

function Tastenfeld({ laenge, onTaste }: { laenge: number; onTaste: (t: string) => void }) {
  return (
    <>
      <div className="pinpunkte" aria-label={`${laenge} von 4 Ziffern`}>{[0, 1, 2, 3].map(i => <i key={i} className={laenge > i ? 'voll' : ''} />)}</div>
      <div className="tasten">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((t, i) =>
          t === '' ? <span key={i} /> : <button key={i} type="button" aria-label={t === '⌫' ? 'Löschen' : t} onClick={() => onTaste(t)}>{t}</button>)}
      </div>
    </>
  )
}

/** Sperrbildschirm beim Öffnen der App. */
export function PinSperre({ hash, onEntsperrt }: { hash: string; onEntsperrt: () => void }) {
  const [pin, setPin] = useState('')
  const [falsch, setFalsch] = useState(false)
  async function taste(t: string) {
    if (t === '⌫') return setPin(pin.slice(0, -1))
    const neu = pin + t
    setPin(neu); setFalsch(false)
    if (neu.length === 4) {
      if ((await pinHash(neu)) === hash) onEntsperrt()
      else { setFalsch(true); setPin('') }
    }
  }
  return (
    <div className="pinseite">
      <h1>Finanzplaner</h1>
      <p className={falsch ? 'fehler' : 'gedaempft'}>{falsch ? 'Falsche PIN. Bitte erneut versuchen.' : 'PIN eingeben'}</p>
      <Tastenfeld laenge={pin.length} onTaste={taste} />
    </div>
  )
}

/** PIN festlegen: zweimal eingeben. */
export function PinFestlegen({ onFertig }: { onFertig: (hash: string) => void }) {
  const [erste, setErste] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [fehler, setFehler] = useState('')
  async function taste(t: string) {
    if (t === '⌫') return setPin(pin.slice(0, -1))
    const neu = pin + t
    setPin(neu); setFehler('')
    if (neu.length < 4) return
    if (erste == null) { setErste(neu); setPin('') }
    else if (erste === neu) onFertig(await pinHash(neu))
    else { setErste(null); setPin(''); setFehler('Die PINs stimmen nicht überein. Bitte neu beginnen.') }
  }
  return (
    <div className="pinseite eingebettet">
      <p className={fehler ? 'fehler' : 'gedaempft'}>{fehler || (erste == null ? 'Neue 4-stellige PIN eingeben' : 'PIN zur Bestätigung wiederholen')}</p>
      <Tastenfeld laenge={pin.length} onTaste={taste} />
      <p className="klein gedaempft">Die PIN wird nur als verschlüsselter Prüfwert auf deinem Gerät gespeichert. Vergisst du sie, kannst du die App nur über das Löschen der Website-Daten zurücksetzen.</p>
    </div>
  )
}
