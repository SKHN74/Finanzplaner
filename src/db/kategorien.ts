import type { Kategorie } from '../domain/types'

/** Standardkategorien. Nur Namen, keine Beträge. */
export const STANDARD_KATEGORIEN: Pick<Kategorie, 'id' | 'name' | 'art'>[] = [
  { id: 'kat-lebensmittel', name: 'Lebensmittel', art: 'ausgabe' },
  { id: 'kat-wohnen', name: 'Wohnen', art: 'ausgabe' },
  { id: 'kat-mobilitaet', name: 'Mobilität', art: 'ausgabe' },
  { id: 'kat-freizeit', name: 'Freizeit', art: 'ausgabe' },
  { id: 'kat-gesundheit', name: 'Gesundheit', art: 'ausgabe' },
  { id: 'kat-kleidung', name: 'Kleidung', art: 'ausgabe' },
  { id: 'kat-haushalt', name: 'Haushalt', art: 'ausgabe' },
  { id: 'kat-bildung', name: 'Bildung', art: 'ausgabe' },
  { id: 'kat-geschenke', name: 'Geschenke', art: 'ausgabe' },
  { id: 'kat-versicherungen', name: 'Versicherungen', art: 'ausgabe' },
  { id: 'kat-abos', name: 'Abos & Verträge', art: 'ausgabe' },
  { id: 'kat-kredite', name: 'Kredite', art: 'ausgabe' },
  { id: 'kat-sonstiges', name: 'Sonstiges', art: 'ausgabe' },
  { id: 'kat-gehalt', name: 'Gehalt', art: 'einnahme' },
  { id: 'kat-sonstige-einnahmen', name: 'Sonstige Einnahmen', art: 'einnahme' },
]
