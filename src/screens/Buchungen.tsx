import { datumKurz } from '../domain/dates'
import { useState } from 'react'
import { useBestand, useKategorien } from '../app/hooks'
import { fromIso, heute } from '../domain/dates'
import { formatEuro } from '../domain/money'
import { finanzmonat, imZeitraum } from '../domain/period'
import { useEditor } from '../ui/editor'
import { BUCHUNGSART } from '../ui/felder'
import { Eintrag, Leer } from '../ui/teile'

export function Buchungen() {
  const b = useBestand()
  const kats = useKategorien()
  const oeffnen = useEditor()
  const [offset, setOffset] = useState(0)
  if (!b) return null
  const z = finanzmonat(heute(), b.einstellungen.monatsbeginn, offset)
  const liste = b.buchungen.filter(x => imZeitraum(fromIso(x.datum), z)).sort((a, c) => c.datum.localeCompare(a.datum) || c.erstelltAm.localeCompare(a.erstelltAm))
  const katName = (id?: string) => kats.find(k => k.id === id)?.name ?? 'Ohne Kategorie'
  const label = b.einstellungen.monatsbeginn === 1
    ? z.start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : `${z.start.toLocaleDateString('de-DE')} – ${z.ende.toLocaleDateString('de-DE')}`

  return (
    <>
      <div className="zeile">
        <button className="btn sek" aria-label="Vorheriger Monat" onClick={() => setOffset(offset + 1)}>‹</button>
        <strong>{label}</strong>
        <button className="btn sek" aria-label="Nächster Monat" disabled={offset === 0} onClick={() => setOffset(offset - 1)}>›</button>
      </div>
      <section className="karte liste">
        {liste.length === 0 && <Leer>In diesem Monat gibt es noch keine Buchungen. Tippe auf + um eine Ausgabe, Einnahme oder Rückerstattung zu erfassen.</Leer>}
        {liste.map((x, i) => {
          const plus = x.art === 'einnahme' || x.art === 'rueckerstattung'
          const kopf = i === 0 || liste[i - 1].datum !== x.datum ? x.datum : null
          const konto = b.konten.find(k => k.id === x.kontoId)?.name
          return (
            <div key={x.id} className="gruppe">
              {kopf && <div className="datumskopf">{datumKurz(kopf)}</div>}
              <Eintrag
                titel={x.notiz || katName(x.kategorieId)}
                unter={`${BUCHUNGSART[x.art]}${x.art !== 'umbuchung' ? ' · ' + katName(x.kategorieId) : ''}${konto ? ' · ' + konto : ''}`}
                rechts={<span className={`betrag zahl ${plus ? 'plus' : ''}`}>{x.art === 'umbuchung' ? '' : plus ? '+' : '−'}{formatEuro(x.betrag)}</span>}
                onClick={() => oeffnen({ typ: 'buchung', id: x.id })}
              />
            </div>
          )
        })}
      </section>
    </>
  )
}
