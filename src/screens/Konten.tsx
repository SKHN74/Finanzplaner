import { useBestand } from '../app/hooks'
import { kontostand } from '../domain/calc'
import { formatEuro } from '../domain/money'
import { useEditor } from '../ui/editor'
import { KONTOTYP } from '../ui/felder'
import { Eintrag, Leer } from '../ui/teile'

export function Konten() {
  const b = useBestand()
  const oeffnen = useEditor()
  if (!b) return null
  const summe = b.konten.reduce((a, k) => a + kontostand(k, b.buchungen), 0)
  return (
    <>
      {b.konten.length > 0 && <section className="karte"><h2>Summe aller Konten</h2><p className="gross zahl">{formatEuro(summe)}</p></section>}
      <section className="karte liste">
        {b.konten.length === 0 && <Leer>Lege dein erstes Konto mit dem aktuellen Kontostand an.</Leer>}
        {b.konten.map(k => (
          <Eintrag key={k.id} titel={k.name} unter={KONTOTYP[k.typ]} rechts={<span className="betrag zahl">{formatEuro(kontostand(k, b.buchungen))}</span>} onClick={() => oeffnen({ typ: 'konto', id: k.id })} />
        ))}
        <button className="btn sek" onClick={() => oeffnen({ typ: 'konto' })}>+ Konto hinzufügen</button>
      </section>
    </>
  )
}
