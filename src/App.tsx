import { useCallback, useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './app/Layout'
import { useBestand, useModus } from './app/hooks'
import { grundausstattung } from './db/repo'
import { EditorKontext, type EditorAufruf } from './ui/editor'
import { EditorHost } from './ui/EditorHost'
import { PinSperre } from './ui/Pin'
import { Uebersicht } from './screens/Uebersicht'
import { Buchungen } from './screens/Buchungen'
import { Budget } from './screens/Budget'
import { Vertraege } from './screens/Vertraege'
import { Mehr } from './screens/Mehr'
import { Konten } from './screens/Konten'
import { Schulden } from './screens/Schulden'
import { Sparziele } from './screens/Sparziele'
import { Analysen } from './screens/Analysen'
import { Einrichtung } from './screens/Einrichtung'
import { Einstellungen } from './screens/Einstellungen'

/** Nach so vielen Millisekunden im Hintergrund wird die App wieder gesperrt. */
const SPERRE_NACH = 60_000

export default function App() {
  const modus = useModus()
  const b = useBestand()
  const [aufruf, setAufruf] = useState<EditorAufruf | null>(null)
  const [entsperrt, setEntsperrt] = useState<boolean | null>(null)
  const versteckt = useRef<number | null>(null)
  const schliessen = useCallback(() => setAufruf(null), [])

  useEffect(() => {
    grundausstattung()
    // Dauerhaften Speicher anfordern, damit der Browser die Daten nicht automatisch entfernt.
    navigator.storage?.persist?.().catch(() => undefined)
  }, [modus])

  useEffect(() => {
    const f = () => {
      if (document.hidden) versteckt.current = Date.now()
      else if (versteckt.current && Date.now() - versteckt.current > SPERRE_NACH) setEntsperrt(false)
    }
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])

  if (!b) return null
  // Beim Start entscheiden, ob gesperrt wird. Eine später neu gesetzte PIN sperrt erst beim nächsten Öffnen.
  if (entsperrt === null) {
    setEntsperrt(!b.einstellungen.pinAktiv)
    return null
  }
  const e = b.einstellungen
  if (e.pinAktiv && e.pinHash && !entsperrt) return <PinSperre hash={e.pinHash} onEntsperrt={() => setEntsperrt(true)} />
  const ersterStart = Object.keys(e.onboarding).length === 0

  return (
    <EditorKontext.Provider value={setAufruf}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={ersterStart && !sessionStorageGesehen() ? <Navigate to="/einrichtung" replace /> : <Uebersicht />} />
            <Route path="buchungen" element={<Buchungen />} />
            <Route path="budget" element={<Budget />} />
            <Route path="vertraege" element={<Vertraege />} />
            <Route path="mehr" element={<Mehr />} />
            <Route path="konten" element={<Konten />} />
            <Route path="schulden" element={<Schulden />} />
            <Route path="sparziele" element={<Sparziele />} />
            <Route path="analysen" element={<Analysen />} />
            <Route path="einrichtung" element={<Einrichtung />} />
            <Route path="einstellungen" element={<Einstellungen />} />
          </Route>
        </Routes>
      </HashRouter>
      {aufruf && <EditorHost key={JSON.stringify(aufruf)} aufruf={aufruf} onSchliessen={schliessen} />}
    </EditorKontext.Provider>
  )
}

/** Die Einrichtung öffnet sich beim ersten Start einmal automatisch, danach nicht mehr pro Sitzung. */
function sessionStorageGesehen(): boolean {
  try {
    if (sessionStorage.getItem('einrichtung-gesehen')) return true
    sessionStorage.setItem('einrichtung-gesehen', '1')
  } catch { /* ohne Speicher: jedes Mal anbieten */ }
  return false
}
