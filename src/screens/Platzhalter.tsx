/** Platzhalter für Bereiche, die in Phase 4 nach dem Prototyp umgesetzt werden. */
export function Platzhalter({ text }: { text: string }) {
  return (
    <section className="karte">
      <p className="gedaempft">{text}</p>
      <p className="klein gedaempft">Dieser Bereich wird in Phase 4 umgesetzt.</p>
    </section>
  )
}
