/**
 * Rechenkern. Reine Funktionen ohne Datenbankzugriff, vollständig testbar.
 * Grundsatz: Fehlt eine Grundlage, wird null zurückgegeben statt eines geschätzten Werts.
 */
import { fromIso, plusMonate } from './dates'
import { finanzmonat, imZeitraum } from './period'
import {
  FIXKOSTEN_SCHRITTE,
  type Buchung, type Cent, type Einstellungen, type Intervall, type Konto, type OnboardingSchritt,
  type Schuld, type Sparziel, type Wiederkehrend, type Budget,
} from './types'

export interface Bestand {
  konten: Konto[]
  buchungen: Buchung[]
  wiederkehrend: Wiederkehrend[]
  schulden: Schuld[]
  sparziele: Sparziel[]
  budgets: Budget[]
  einstellungen: Einstellungen
}

const PRO_MONAT: Record<Intervall, number> = {
  woechentlich: 52 / 12, monatlich: 1, quartal: 1 / 3, halbjahr: 1 / 6, jaehrlich: 1 / 12,
}

export function aufMonat(w: Pick<Wiederkehrend, 'betrag' | 'intervall'>): Cent {
  return Math.round(w.betrag * PRO_MONAT[w.intervall])
}

/** Aktiv = Status aktiv, oder gekündigt mit Laufzeitende in der Zukunft. */
export function istAktiv(w: Wiederkehrend, stichtag: Date): boolean {
  if (w.status === 'aktiv') return true
  if (w.status === 'gekuendigt' && w.laufzeitEnde) return fromIso(w.laufzeitEnde) >= stichtag
  return false
}

export function kontostand(k: Konto, buchungen: Buchung[]): Cent {
  const ab = fromIso(k.saldoStichtag)
  let s = k.anfangssaldo
  for (const b of buchungen) {
    if (fromIso(b.datum) < ab) continue
    if (b.kontoId === k.id) s += b.art === 'einnahme' || b.art === 'rueckerstattung' ? b.betrag : -b.betrag
    if (b.art === 'umbuchung' && b.zielKontoId === k.id) s += b.betrag
  }
  return s
}

/** Variable Ausgaben im Zeitraum: Ausgaben minus Rückerstattungen, ohne Buchungen aus wiederkehrenden Zahlungen. */
export function variableAusgaben(buchungen: Buchung[], stichtag: Date, monatsbeginn: number, offset = 0, kategorieId?: string): Cent {
  const z = finanzmonat(stichtag, monatsbeginn, offset)
  let s = 0
  for (const b of buchungen) {
    if (b.wiederkehrendId || !imZeitraum(fromIso(b.datum), z)) continue
    if (kategorieId !== undefined && b.kategorieId !== kategorieId) continue
    if (b.art === 'ausgabe') s += b.betrag
    else if (b.art === 'rueckerstattung') s -= b.betrag
  }
  return s
}

/** Nötige Monatsrate für ein Sparziel; null ohne Zieldatum. */
export function sparrate(z: Sparziel, stichtag: Date): Cent | null {
  if (!z.zieldatum) return null
  const rest = z.zielbetrag - z.eingezahlt
  if (rest <= 0) return 0
  const ziel = fromIso(z.zieldatum)
  const monate = Math.max(1, (ziel.getFullYear() - stichtag.getFullYear()) * 12 + ziel.getMonth() - stichtag.getMonth())
  return Math.ceil(rest / monate)
}

export type SchuldenEnde =
  | { art: 'datum'; raten: number; datum: Date }
  | { art: 'fehlt'; feld: 'rate' | 'zinssatz' }
  | { art: 'nie' }

export function schuldenEnde(s: Schuld, stichtag: Date): SchuldenEnde {
  if (!s.rate) return { art: 'fehlt', feld: 'rate' }
  if (s.zinssatz == null) return { art: 'fehlt', feld: 'zinssatz' }
  if (s.restschuld <= 0) return { art: 'datum', raten: 0, datum: stichtag }
  const r = s.zinssatz / 100 / 12
  const n = r === 0 ? Math.ceil(s.restschuld / s.rate)
    : s.rate <= r * s.restschuld ? Infinity
    : Math.ceil(-Math.log(1 - (r * s.restschuld) / s.rate) / Math.log(1 + r))
  if (!Number.isFinite(n)) return { art: 'nie' }
  return { art: 'datum', raten: n, datum: plusMonate(new Date(stichtag.getFullYear(), stichtag.getMonth(), 1), n) }
}

export function naechsteFaelligkeit(w: Wiederkehrend, stichtag: Date): Date | null {
  if (!w.naechsteFaelligkeit) return null
  const start = fromIso(w.naechsteFaelligkeit)
  let d = start
  const schritt = { monatlich: 1, quartal: 3, halbjahr: 6, jaehrlich: 12 } as const
  for (let i = 1; d < stichtag && i < 2000; i++) {
    d = w.intervall === 'woechentlich'
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * i)
      : plusMonate(start, schritt[w.intervall] * i)
  }
  if (w.laufzeitEnde && d > fromIso(w.laufzeitEnde)) return null
  return d
}

export function schrittErledigt(e: Einstellungen, s: OnboardingSchritt): boolean {
  return e.onboarding[s] === 'erledigt'
}

export interface Uebersicht {
  /** null = keine Einnahmen erfasst. */
  einnahmenMonat: Cent | null
  fixkostenMonat: Cent
  /** Fixkosten-Bereiche, die noch nicht als vollständig markiert sind. */
  fixkostenOffen: OnboardingSchritt[]
  fixkostenVollstaendig: boolean
  variableAusgaben: Cent
  sparraten: Cent
  /** null = kein Konto angelegt. */
  vermoegen: Cent | null
  /** null = nicht berechenbar (Einnahmen fehlen). */
  freiVerfuegbar: Cent | null
  /** true, wenn freiVerfuegbar auf unvollständigen Fixkosten beruht. */
  vorlaeufig: boolean
}

export function uebersicht(b: Bestand, stichtag: Date): Uebersicht {
  const aktiv = b.wiederkehrend.filter(w => istAktiv(w, stichtag))
  const ein = aktiv.filter(w => w.unterart === 'einkommen')
  const einnahmenMonat = ein.length ? ein.reduce((a, w) => a + aufMonat(w), 0) : null
  const fixkostenMonat = aktiv.filter(w => w.unterart !== 'einkommen').reduce((a, w) => a + aufMonat(w), 0)
  const fixkostenOffen = FIXKOSTEN_SCHRITTE.filter(s => !schrittErledigt(b.einstellungen, s))
  const va = variableAusgaben(b.buchungen, stichtag, b.einstellungen.monatsbeginn)
  const sparraten = b.sparziele.reduce((a, z) => a + (sparrate(z, stichtag) ?? 0), 0)
  const vermoegen = b.konten.length
    ? b.konten.reduce((a, k) => a + kontostand(k, b.buchungen), 0) - b.schulden.reduce((a, s) => a + s.restschuld, 0)
    : null
  const freiVerfuegbar = einnahmenMonat == null ? null : einnahmenMonat - fixkostenMonat - sparraten - va
  return {
    einnahmenMonat, fixkostenMonat, fixkostenOffen, fixkostenVollstaendig: fixkostenOffen.length === 0,
    variableAusgaben: va, sparraten, vermoegen, freiVerfuegbar,
    vorlaeufig: freiVerfuegbar != null && fixkostenOffen.length > 0,
  }
}

export interface Hinweis {
  text: string
  ziel: { art: 'onboarding'; schritt: OnboardingSchritt } | { art: 'neu'; typ: 'konto' } | { art: 'bearbeiten'; typ: 'schuld'; id: string }
}

export function hinweise(b: Bestand, stichtag: Date): Hinweis[] {
  const u = uebersicht(b, stichtag)
  const h: Hinweis[] = []
  if (!b.konten.length) h.push({ text: 'Lege dein erstes Konto mit dem aktuellen Kontostand an.', ziel: { art: 'neu', typ: 'konto' } })
  if (u.einnahmenMonat == null) h.push({ text: 'Füge deine monatlichen Einnahmen hinzu.', ziel: { art: 'onboarding', schritt: 'einnahmen' } })
  if (!u.fixkostenVollstaendig) h.push({ text: 'Deine Fixkosten sind noch nicht vollständig.', ziel: { art: 'onboarding', schritt: u.fixkostenOffen[0] } })
  if (u.einnahmenMonat == null || !u.fixkostenVollstaendig) {
    h.push({
      text: 'Dein Budget kann noch nicht vollständig berechnet werden.',
      ziel: { art: 'onboarding', schritt: u.einnahmenMonat == null ? 'einnahmen' : u.fixkostenOffen[0] },
    })
  }
  for (const s of b.schulden) {
    const e = schuldenEnde(s, stichtag)
    if (e.art === 'fehlt') {
      h.push({
        text: `Ergänze ${e.feld === 'rate' ? 'die Rate' : 'den Zinssatz'} bei „${s.name}“, um das Ende zu berechnen.`,
        ziel: { art: 'bearbeiten', typ: 'schuld', id: s.id },
      })
    }
  }
  return h
}
