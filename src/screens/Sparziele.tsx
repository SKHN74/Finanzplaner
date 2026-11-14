import { datumKurz } from '../domain/dates'
import { useBestand } from '../app/hooks'
import { sparrate } from '../domain/calc'
import { heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { useEditor } from '../ui/editor'
import { Balken, Leer } from '../ui/teile'

export function Sparziele() {
  const b = useBestand()
  const oeffnen = useEditor()
  if (!b) return null
  return (
    <section className="karte liste">
      {b.sparziele.length === 0 && <Leer>Noch keine Sparziele.</Leer>}
      {b.sparziele.map(z => {
        const r = sparrate(z, heute())
        const anteil = z.zielbetrag ? z.eingezahlt / z.zielbetrag : 0
        return (
          <div key={z.id} className="budgetzeile">
            <span className="zeile"><strong>{z.name}</strong><span className="zahl klein">{formatEuro(z.eingezahlt)} / {formatEuro(z.zielbetrag)}</span></span>
            <Balken anteil={anteil} />
            <span className="klein gedaempft">
              {Math.round(anteil * 100)} % erreicht
              {z.zieldatum ? ` · Ziel ${datumKurz(z.zieldatum)} · nötig: ${formatEuro(r)} pro Monat` : ' · Ohne Zieldatum keine Monatsrate'}
            </span>
            <span className="aktionen">
              <button className="btn sek" onClick={() => oeffnen({ typ: 'einzahlung', id: z.id })}>Einzahlen</button>
              <button className="btn sek" onClick={() => oeffnen({ typ: 'sparziel', id: z.id })}>Bearbeiten</button>
            </span>
          </div>
        )
      })}
      <button className="btn sek" onClick={() => oeffnen({ typ: 'sparziel' })}>+ Sparziel hinzufügen</button>
    </section>
  )
}
