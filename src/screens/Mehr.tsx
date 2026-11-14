import { Link } from 'react-router-dom'

const EINTRAEGE = [
  ['/konten', 'Konten', 'Girokonten, Sparkonten, Bargeld'],
  ['/schulden', 'Schulden', 'Kredite, Restschuld, Tilgung'],
  ['/sparziele', 'Sparziele', 'Ziele und Fortschritt'],
  ['/analysen', 'Analysen', 'Ausgaben, Verlauf, Quoten'],
  ['/einrichtung', 'Einrichtung', 'Onboarding-Schritte'],
  ['/einstellungen', 'Einstellungen', 'Monatsbeginn, PIN, Testmodus, Sicherung'],
]

export function Mehr() {
  return (
    <section className="karte liste">
      {EINTRAEGE.map(([pfad, titel, text]) => (
        <Link key={pfad} to={pfad} className="eintrag">
          <span className="punkt">{titel[0]}</span>
          <span className="haupt"><span className="t">{titel}</span><span className="s">{text}</span></span>
          <span className="gedaempft">›</span>
        </Link>
      ))}
    </section>
  )
}
