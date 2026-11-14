/**
 * Datenmodell des Finanzplaners.
 * Alle Geldbeträge sind ganze Cent (number), damit keine Rundungsfehler entstehen.
 * Datumswerte sind ISO-Strings im Format JJJJ-MM-TT (lokale Zeit, ohne Uhrzeit).
 */
export type Cent = number
export type IsoDate = string
export type Datensatz = 'echt' | 'test'

export interface Basis {
  id: string
  erstelltAm: string
  geaendertAm: string
  /** Kennzeichnung, aus welchem Bereich der Datensatz stammt. */
  datensatz: Datensatz
}

export type Kontotyp = 'giro' | 'spar' | 'bargeld' | 'kredit' | 'depot'
export interface Konto extends Basis {
  name: string
  typ: Kontotyp
  /** Kontostand am Stichtag. Spätere Buchungen werden dazugerechnet. */
  anfangssaldo: Cent
  saldoStichtag: IsoDate
  aktiv: boolean
}

export type KategorieArt = 'ausgabe' | 'einnahme'
export interface Kategorie extends Basis {
  name: string
  art: KategorieArt
  symbol?: string
}

export type BuchungsArt = 'ausgabe' | 'einnahme' | 'rueckerstattung' | 'umbuchung'
export interface Buchung extends Basis {
  datum: IsoDate
  betrag: Cent
  art: BuchungsArt
  kontoId?: string
  /** Nur bei Umbuchungen: Zielkonto. */
  zielKontoId?: string
  kategorieId?: string
  notiz?: string
  /** Gesetzt, wenn die Buchung aus einer wiederkehrenden Zahlung entstand. */
  wiederkehrendId?: string
}

export type Unterart = 'einkommen' | 'fixkosten' | 'versicherung' | 'abo' | 'vertrag' | 'rate' | 'sonstiges'
export type Intervall = 'woechentlich' | 'monatlich' | 'quartal' | 'halbjahr' | 'jaehrlich'
export type VertragsStatus = 'aktiv' | 'pausiert' | 'gekuendigt' | 'beendet'
export interface Wiederkehrend extends Basis {
  name: string
  unterart: Unterart
  betrag: Cent
  intervall: Intervall
  naechsteFaelligkeit?: IsoDate
  status: VertragsStatus
  kontoId?: string
  kategorieId?: string
  anbieter?: string
  vertragsbeginn?: IsoDate
  laufzeitEnde?: IsoDate
  kuendigungsfrist?: string
  /** Gesetzt, wenn diese Rate zu einer Schuld gehört. */
  schuldId?: string
}

export interface Schuld extends Basis {
  name: string
  glaeubiger?: string
  ursprungsbetrag?: Cent
  restschuld: Cent
  /** Zinssatz p. a. in Prozent; undefined = unbekannt (kein Enddatum berechenbar). */
  zinssatz?: number
  /** Monatliche Rate; wird als wiederkehrende Zahlung (unterart 'rate') gespiegelt. */
  rate?: Cent
  startdatum?: IsoDate
}

export interface Sparziel extends Basis {
  name: string
  zielbetrag: Cent
  eingezahlt: Cent
  zieldatum?: IsoDate
  kontoId?: string
}

export interface Budget extends Basis {
  kategorieId: string
  betrag: Cent
}

export type SchrittStatus = 'offen' | 'uebersprungen' | 'erledigt'
export const ONBOARDING_SCHRITTE = [
  'start', 'hauptkonto', 'konten', 'einnahmen', 'fixkosten', 'versicherungen',
  'abos', 'vertraege', 'schulden', 'raten', 'sparziele', 'sonstiges',
] as const
export type OnboardingSchritt = (typeof ONBOARDING_SCHRITTE)[number]

/** Schritte, die erledigt sein müssen, damit Fixkosten als vollständig gelten. */
export const FIXKOSTEN_SCHRITTE: OnboardingSchritt[] = ['fixkosten', 'versicherungen', 'abos', 'vertraege', 'raten', 'sonstiges']

export interface Einstellungen {
  id: 'einstellungen'
  waehrung: 'EUR'
  /** Tag, an dem der Finanzmonat beginnt (1–28). Standard: 1. */
  monatsbeginn: number
  pinAktiv: boolean
  /** SHA-256-Hash der PIN, nie die PIN selbst. */
  pinHash?: string
  onboarding: Partial<Record<OnboardingSchritt, SchrittStatus>>
  letzteSicherung?: string
}

export const STANDARD_EINSTELLUNGEN: Einstellungen = {
  id: 'einstellungen',
  waehrung: 'EUR',
  monatsbeginn: 1,
  pinAktiv: false,
  onboarding: {},
}
