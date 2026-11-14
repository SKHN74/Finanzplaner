import type { OnboardingSchritt, Wiederkehrend, Konto } from '../domain/types'
import type { EditorTyp } from './felder'

export interface Schritt {
  key: OnboardingSchritt
  titel: string
  text: string
  typ?: EditorTyp
  vorgabe?: Record<string, string>
  filter?: (x: Record<string, unknown>) => boolean
}

const w = (u: Wiederkehrend['unterart']) => (x: Record<string, unknown>) => x.unterart === u && !x.schuldId
const k = (giro: boolean) => (x: Record<string, unknown>) => ((x as unknown as Konto).typ === 'giro') === giro

export const SCHRITTE: Schritt[] = [
  { key: 'start', titel: 'Willkommen', text: 'Lege fest, wann dein Finanzmonat beginnt, und schütze die App mit einer PIN. Danach trägst du Schritt für Schritt deine Daten ein. Jeder Schritt lässt sich überspringen und später vervollständigen.' },
  { key: 'hauptkonto', titel: 'Dein Hauptkonto', text: 'Trage dein Hauptkonto mit dem aktuellen Kontostand ein.', typ: 'konto', vorgabe: { typ: 'giro' }, filter: k(true) },
  { key: 'konten', titel: 'Weitere Konten und Bargeld', text: 'Sparkonten, Tagesgeld, Kreditkarten oder Bargeld.', typ: 'konto', vorgabe: { typ: 'spar' }, filter: k(false) },
  { key: 'einnahmen', titel: 'Monatliche Einnahmen', text: 'Gehalt, Nebenjob, Kindergeld oder andere regelmäßige Einnahmen.', typ: 'wiederkehrend', vorgabe: { unterart: 'einkommen', kategorieId: 'kat-gehalt' }, filter: w('einkommen') },
  { key: 'fixkosten', titel: 'Fixkosten', text: 'Miete, Nebenkosten, Strom, Internet und andere feste Ausgaben.', typ: 'wiederkehrend', vorgabe: { unterart: 'fixkosten', kategorieId: 'kat-wohnen' }, filter: w('fixkosten') },
  { key: 'versicherungen', titel: 'Versicherungen', text: 'Haftpflicht, Hausrat, Kfz, Berufsunfähigkeit und weitere.', typ: 'wiederkehrend', vorgabe: { unterart: 'versicherung', kategorieId: 'kat-versicherungen' }, filter: w('versicherung') },
  { key: 'abos', titel: 'Abonnements', text: 'Streaming, Musik, Apps, Zeitschriften und weitere.', typ: 'wiederkehrend', vorgabe: { unterart: 'abo', kategorieId: 'kat-abos' }, filter: w('abo') },
  { key: 'vertraege', titel: 'Verträge', text: 'Handy, Fitnessstudio, Vereine und weitere.', typ: 'wiederkehrend', vorgabe: { unterart: 'vertrag', kategorieId: 'kat-abos' }, filter: w('vertrag') },
  { key: 'schulden', titel: 'Schulden', text: 'Kredite, Darlehen, offene Beträge. Mit Rate wird die Rate automatisch zu deinen Fixkosten.', typ: 'schuld', filter: () => true },
  { key: 'raten', titel: 'Laufende Raten', text: 'Ratenkäufe oder Finanzierungen, die du nicht als Schuld erfasst hast.', typ: 'wiederkehrend', vorgabe: { unterart: 'rate', kategorieId: 'kat-kredite' }, filter: w('rate') },
  { key: 'sparziele', titel: 'Sparziele', text: 'Wofür möchtest du sparen? Mit Zieldatum berechnet die App die nötige Monatsrate.', typ: 'sparziel', filter: () => true },
  { key: 'sonstiges', titel: 'Sonstige Verpflichtungen', text: 'Unterhalt, Mitgliedsbeiträge, Spenden oder anderes Regelmäßiges.', typ: 'wiederkehrend', vorgabe: { unterart: 'sonstiges', kategorieId: 'kat-sonstiges' }, filter: w('sonstiges') },
]
