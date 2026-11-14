import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useModus } from './hooks'

const TABS = [
  { pfad: '/', titel: 'Übersicht', icon: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z' },
  { pfad: '/buchungen', titel: 'Buchungen', icon: 'M4 6h16M4 12h16M4 18h10' },
  { pfad: '/budget', titel: 'Budget', icon: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 4v8l6 4' },
  { pfad: '/vertraege', titel: 'Verträge', icon: 'M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM9 8h6M9 12h6M9 16h4' },
  { pfad: '/mehr', titel: 'Mehr', icon: 'M5 12h.01M12 12h.01M19 12h.01' },
]

const TITEL: Record<string, string> = {
  '/': 'Übersicht', '/buchungen': 'Buchungen', '/budget': 'Budget', '/vertraege': 'Verträge', '/mehr': 'Mehr',
  '/konten': 'Konten', '/schulden': 'Schulden', '/sparziele': 'Sparziele', '/analysen': 'Analysen',
  '/einstellungen': 'Einstellungen', '/einrichtung': 'Einrichtung',
}

export function Layout() {
  const modus = useModus()
  const ort = useLocation()
  const nav = useNavigate()
  const istTab = TABS.some(t => t.pfad === ort.pathname)
  return (
    <div className="app">
      {modus === 'test' && (
        <div className="testband" role="status">
          <span>Testmodus · künstliche Daten</span>
          <button onClick={() => nav('/einstellungen')}>Wechseln</button>
        </div>
      )}
      <header className="kopf">
        {!istTab && <button className="zurueck" aria-label="Zurück" onClick={() => nav(-1)}>‹</button>}
        <h1>{TITEL[ort.pathname] ?? 'Finanzplaner'}</h1>
      </header>
      <main className="inhalt">
        <Outlet />
      </main>
      <nav className="tabs" aria-label="Hauptnavigation">
        {TABS.map(t => (
          <NavLink key={t.pfad} to={t.pfad} end className={({ isActive }) => (isActive ? 'an' : '')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
            <span>{t.titel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
