import type { Kategorie, Konto } from '../domain/types'

export const KONTOTYP = { giro: 'Girokonto', spar: 'Sparkonto / Tagesgeld', bargeld: 'Bargeld', kredit: 'Kreditkarte', depot: 'Depot' }
export const BUCHUNGSART = { ausgabe: 'Ausgabe', einnahme: 'Einnahme', rueckerstattung: 'Rückerstattung', umbuchung: 'Umbuchung' }
export const UNTERART = { einkommen: 'Einnahme', fixkosten: 'Fixkosten', versicherung: 'Versicherung', abo: 'Abonnement', vertrag: 'Vertrag', rate: 'Rate', sonstiges: 'Sonstige Verpflichtung' }
export const INTERVALL = { monatlich: 'monatlich', woechentlich: 'wöchentlich', quartal: 'vierteljährlich', halbjahr: 'halbjährlich', jaehrlich: 'jährlich' }
export const STATUS = { aktiv: 'aktiv', pausiert: 'pausiert', gekuendigt: 'gekündigt', beendet: 'beendet' }

export type EditorTyp = 'konto' | 'buchung' | 'wiederkehrend' | 'schuld' | 'sparziel' | 'budget' | 'einzahlung'

export interface Kontext { kategorien: Kategorie[]; konten: Konto[] }
export interface Feld {
  k: string
  l: string
  t: 'text' | 'money' | 'date' | 'select' | 'number'
  pflicht?: boolean
  platzhalter?: string
  hilfe?: string
  optionen?: (c: Kontext) => [string, string][]
  leer?: string
  wenn?: (v: Record<string, string>) => boolean
  standard?: () => string
}

const o = (x: Record<string, string>) => Object.entries(x)
const konten = (c: Kontext) => c.konten.map(k => [k.id, k.name] as [string, string])
const kats = (art?: 'ausgabe' | 'einnahme') => (c: Kontext) => c.kategorien.filter(k => !art || k.art === art).map(k => [k.id, k.name] as [string, string])

export const SCHEMA: Record<EditorTyp, { titel: string; tabelle?: string; felder: Feld[] }> = {
  konto: { titel: 'Konto', tabelle: 'konten', felder: [
    { k: 'name', l: 'Name', t: 'text', pflicht: true, platzhalter: 'z. B. Girokonto' },
    { k: 'typ', l: 'Kontoart', t: 'select', optionen: () => o(KONTOTYP) },
    { k: 'anfangssaldo', l: 'Kontostand am Stichtag', t: 'money', pflicht: true, hilfe: 'Spätere Buchungen werden automatisch dazugerechnet.' },
    { k: 'saldoStichtag', l: 'Stichtag', t: 'date', pflicht: true },
  ] },
  buchung: { titel: 'Buchung', tabelle: 'buchungen', felder: [
    { k: 'art', l: 'Art', t: 'select', optionen: () => o(BUCHUNGSART) },
    { k: 'betrag', l: 'Betrag', t: 'money', pflicht: true },
    { k: 'datum', l: 'Datum', t: 'date', pflicht: true },
    { k: 'kontoId', l: 'Konto', t: 'select', optionen: konten, leer: 'Kein Konto' },
    { k: 'zielKontoId', l: 'Auf Konto', t: 'select', optionen: konten, leer: 'Bitte wählen', wenn: v => v.art === 'umbuchung' },
    { k: 'kategorieId', l: 'Kategorie', t: 'select', optionen: c => kats()(c), leer: 'Ohne Kategorie', wenn: v => v.art !== 'umbuchung' },
    { k: 'notiz', l: 'Notiz', t: 'text', platzhalter: 'z. B. Neue Kaffeemaschine' },
  ] },
  wiederkehrend: { titel: 'Wiederkehrende Zahlung', tabelle: 'wiederkehrend', felder: [
    { k: 'name', l: 'Bezeichnung', t: 'text', pflicht: true, platzhalter: 'z. B. Handyvertrag' },
    { k: 'unterart', l: 'Art', t: 'select', optionen: () => o(UNTERART) },
    { k: 'betrag', l: 'Betrag pro Zahlung', t: 'money', pflicht: true },
    { k: 'intervall', l: 'Intervall', t: 'select', optionen: () => o(INTERVALL) },
    { k: 'naechsteFaelligkeit', l: 'Nächste Fälligkeit', t: 'date', hilfe: 'Mit Datum erinnert die Übersicht dich ans Buchen.' },
    { k: 'status', l: 'Status', t: 'select', optionen: () => o(STATUS), hilfe: 'Gekündigt zählt bis zum Laufzeitende mit, danach nicht mehr.' },
    { k: 'kategorieId', l: 'Kategorie', t: 'select', optionen: c => kats()(c), leer: 'Ohne Kategorie' },
    { k: 'kontoId', l: 'Konto', t: 'select', optionen: konten, leer: 'Kein Konto' },
    { k: 'anbieter', l: 'Anbieter', t: 'text' },
    { k: 'vertragsbeginn', l: 'Vertragsbeginn', t: 'date' },
    { k: 'laufzeitEnde', l: 'Laufzeit bis', t: 'date' },
    { k: 'kuendigungsfrist', l: 'Kündigungsfrist', t: 'text', platzhalter: 'z. B. 1 Monat zum Monatsende' },
  ] },
  schuld: { titel: 'Schuld', tabelle: 'schulden', felder: [
    { k: 'name', l: 'Bezeichnung', t: 'text', pflicht: true, platzhalter: 'z. B. Autokredit' },
    { k: 'glaeubiger', l: 'Gläubiger', t: 'text' },
    { k: 'ursprungsbetrag', l: 'Ursprünglicher Betrag', t: 'money' },
    { k: 'restschuld', l: 'Aktuelle Restschuld', t: 'money', pflicht: true },
    { k: 'zinssatz', l: 'Zinssatz p. a. in %', t: 'number', hilfe: 'Leer lassen, wenn unbekannt. Dann wird kein Enddatum berechnet.' },
    { k: 'rate', l: 'Monatliche Rate', t: 'money', hilfe: 'Wird automatisch als Rate bei deinen Fixkosten geführt.' },
  ] },
  sparziel: { titel: 'Sparziel', tabelle: 'sparziele', felder: [
    { k: 'name', l: 'Name', t: 'text', pflicht: true, platzhalter: 'z. B. Notgroschen' },
    { k: 'zielbetrag', l: 'Zielbetrag', t: 'money', pflicht: true },
    { k: 'eingezahlt', l: 'Bereits gespart', t: 'money' },
    { k: 'zieldatum', l: 'Zieldatum', t: 'date', hilfe: 'Optional. Mit Datum wird die nötige Monatsrate berechnet.' },
  ] },
  budget: { titel: 'Budget', felder: [{ k: 'betrag', l: 'Monatsbudget', t: 'money', hilfe: 'Leer lassen, um das Budget zu entfernen.' }] },
  einzahlung: { titel: 'Einzahlen', felder: [{ k: 'betrag', l: 'Betrag', t: 'money', pflicht: true, hilfe: 'Für eine Entnahme einen negativen Betrag eingeben.' }] },
}
