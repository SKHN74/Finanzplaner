import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './app/Layout'
import { useModus } from './app/hooks'
import { grundausstattung } from './db/repo'
import { Uebersicht } from './screens/Uebersicht'
import { Mehr } from './screens/Mehr'
import { Einstellungen } from './screens/Einstellungen'
import { Platzhalter } from './screens/Platzhalter'

export default function App() {
  const modus = useModus()
  useEffect(() => {
    grundausstattung()
    // Dauerhaften Speicher anfordern, damit der Browser die Daten nicht automatisch entfernt.
    navigator.storage?.persist?.().catch(() => undefined)
  }, [modus])

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Uebersicht />} />
          <Route path="buchungen" element={<Platzhalter text="Alle Einnahmen, Ausgaben, Rückerstattungen und Umbuchungen nach Finanzmonat." />} />
          <Route path="budget" element={<Platzhalter text="Monatsbudgets je Kategorie mit Ist, Plan und Rest." />} />
          <Route path="vertraege" element={<Platzhalter text="Fixkosten, Versicherungen, Abos, Verträge, Raten und regelmäßige Einnahmen." />} />
          <Route path="mehr" element={<Mehr />} />
          <Route path="konten" element={<Platzhalter text="Konten und Bargeld mit berechnetem Kontostand." />} />
          <Route path="schulden" element={<Platzhalter text="Schulden mit Restschuld, Zinssatz, Rate und voraussichtlichem Ende." />} />
          <Route path="sparziele" element={<Platzhalter text="Sparziele mit Fortschritt und nötiger Monatsrate." />} />
          <Route path="analysen" element={<Platzhalter text="Ausgaben nach Kategorie, Verlauf und Quoten." />} />
          <Route path="einrichtung" element={<Platzhalter text="Onboarding in 12 kleinen, überspringbaren Schritten." />} />
          <Route path="einstellungen" element={<Einstellungen />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
