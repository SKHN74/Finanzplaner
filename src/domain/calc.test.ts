import { describe, expect, it } from 'vitest'
import { aufMonat, hinweise, istAktiv, kontostand, naechsteFaelligkeit, schuldenEnde, sparrate, uebersicht, type Bestand } from './calc'
import { STANDARD_EINSTELLUNGEN, FIXKOSTEN_SCHRITTE, type Wiederkehrend, type Konto, type Buchung } from './types'
import { finanzmonat } from './period'
import { parseEuro, formatEuro } from './money'

const basis = { erstelltAm: '', geaendertAm: '', datensatz: 'test' as const }
const STICHTAG = new Date(2026, 10, 14) // 14.11.2026
const leer = (): Bestand => ({ konten: [], buchungen: [], wiederkehrend: [], schulden: [], sparziele: [], budgets: [], einstellungen: { ...STANDARD_EINSTELLUNGEN, onboarding: {} } })
const w = (x: Partial<Wiederkehrend>): Wiederkehrend => ({ ...basis, id: Math.random().toString(), name: '[TEST] x', unterart: 'fixkosten', betrag: 1000, intervall: 'monatlich', status: 'aktiv', ...x })

describe('leere App', () => {
  it('rechnet nichts aus, was fehlt', () => {
    const u = uebersicht(leer(), STICHTAG)
    expect(u.einnahmenMonat).toBeNull()
    expect(u.freiVerfuegbar).toBeNull()
    expect(u.vermoegen).toBeNull()
    expect(u.fixkostenVollstaendig).toBe(false)
  })
  it('zeigt die geforderten Hinweise', () => {
    const texte = hinweise(leer(), STICHTAG).map(h => h.text)
    expect(texte).toContain('Füge deine monatlichen Einnahmen hinzu.')
    expect(texte).toContain('Deine Fixkosten sind noch nicht vollständig.')
    expect(texte).toContain('Dein Budget kann noch nicht vollständig berechnet werden.')
  })
})

describe('Übersicht', () => {
  it('rechnet frei verfügbar und markiert unvollständige Fixkosten als vorläufig', () => {
    const b = leer()
    b.wiederkehrend = [w({ unterart: 'einkommen', betrag: 200000 }), w({ betrag: 80000 }), w({ unterart: 'versicherung', betrag: 12000, intervall: 'jaehrlich' })]
    const u = uebersicht(b, STICHTAG)
    expect(u.einnahmenMonat).toBe(200000)
    expect(u.fixkostenMonat).toBe(81000)
    expect(u.freiVerfuegbar).toBe(119000)
    expect(u.vorlaeufig).toBe(true)
    b.einstellungen.onboarding = Object.fromEntries(FIXKOSTEN_SCHRITTE.map(s => [s, 'erledigt']))
    expect(uebersicht(b, STICHTAG).vorlaeufig).toBe(false)
  })
  it('gekündigter Vertrag zählt bis zum Laufzeitende', () => {
    const x = w({ status: 'gekuendigt', laufzeitEnde: '2026-11-30' })
    expect(istAktiv(x, STICHTAG)).toBe(true)
    expect(istAktiv(x, new Date(2026, 11, 1))).toBe(false)
    expect(istAktiv(w({ status: 'pausiert' }), STICHTAG)).toBe(false)
  })
  it('Rückerstattung senkt die variablen Ausgaben', () => {
    const b = leer()
    const bu = (art: Buchung['art'], betrag: number): Buchung => ({ ...basis, id: art, datum: '2026-11-05', art, betrag })
    b.buchungen = [bu('ausgabe', 5000), bu('rueckerstattung', 2000)]
    expect(uebersicht(b, STICHTAG).variableAusgaben).toBe(3000)
  })
})

it('rechnet Intervalle auf den Monat um', () => {
  expect(aufMonat({ betrag: 1200, intervall: 'jaehrlich' })).toBe(100)
  expect(aufMonat({ betrag: 300, intervall: 'quartal' })).toBe(100)
  expect(aufMonat({ betrag: 1200, intervall: 'woechentlich' })).toBe(5200)
})

it('Kontostand = Anfangssaldo + Buchungen ab Stichtag inkl. Umbuchungen', () => {
  const k: Konto = { ...basis, id: 'a', name: 'A', typ: 'giro', anfangssaldo: 10000, saldoStichtag: '2026-11-01', aktiv: true }
  const bs: Buchung[] = [
    { ...basis, id: '1', datum: '2026-10-31', art: 'ausgabe', betrag: 999, kontoId: 'a' },
    { ...basis, id: '2', datum: '2026-11-02', art: 'ausgabe', betrag: 2500, kontoId: 'a' },
    { ...basis, id: '3', datum: '2026-11-03', art: 'umbuchung', betrag: 1000, kontoId: 'b', zielKontoId: 'a' },
  ]
  expect(kontostand(k, bs)).toBe(8500)
})

describe('Schulden', () => {
  it('braucht Rate und Zinssatz', () => {
    expect(schuldenEnde({ ...basis, id: 's', name: 's', restschuld: 1000 }, STICHTAG)).toEqual({ art: 'fehlt', feld: 'rate' })
    expect(schuldenEnde({ ...basis, id: 's', name: 's', restschuld: 1000, rate: 100 }, STICHTAG)).toEqual({ art: 'fehlt', feld: 'zinssatz' })
  })
  it('zinsfrei: Restschuld / Rate', () => {
    const e = schuldenEnde({ ...basis, id: 's', name: 's', restschuld: 1000, rate: 300, zinssatz: 0 }, STICHTAG)
    expect(e.art === 'datum' && e.raten).toBe(4)
  })
  it('erkennt Raten, die die Zinsen nicht decken', () => {
    expect(schuldenEnde({ ...basis, id: 's', name: 's', restschuld: 1000000, rate: 1000, zinssatz: 12 }, STICHTAG).art).toBe('nie')
  })
})

it('Sparrate nur mit Zieldatum', () => {
  const z = { ...basis, id: 'z', name: 'z', zielbetrag: 120000, eingezahlt: 0 }
  expect(sparrate(z, STICHTAG)).toBeNull()
  expect(sparrate({ ...z, zieldatum: '2027-11-14' }, STICHTAG)).toBe(10000)
})

describe('Finanzmonat', () => {
  it('Standard: Kalendermonat', () => {
    const z = finanzmonat(STICHTAG, 1)
    expect([z.start.getDate(), z.start.getMonth(), z.ende.getDate(), z.ende.getMonth()]).toEqual([1, 10, 30, 10])
  })
  it('einstellbarer Beginn, z. B. am 25.', () => {
    const z = finanzmonat(STICHTAG, 25)
    expect([z.start.getDate(), z.start.getMonth(), z.ende.getDate(), z.ende.getMonth()]).toEqual([25, 9, 24, 10])
    expect(finanzmonat(STICHTAG, 25, 1).start.getMonth()).toBe(8)
  })
})

it('nächste Fälligkeit springt monatlich weiter und hält das Monatsende', () => {
  const d = naechsteFaelligkeit(w({ naechsteFaelligkeit: '2026-01-31' }), STICHTAG)!
  expect([d.getDate(), d.getMonth()]).toEqual([30, 10])
})

it('liest deutsche Beträge', () => {
  expect(parseEuro('1.234,56')).toBe(123456)
  expect(parseEuro('12,5 €')).toBe(1250)
  expect(parseEuro('')).toBeNull()
  expect(parseEuro('abc')).toBeNaN()
  expect(formatEuro(123456).replace(/\s/g, ' ')).toBe('1.234,56 €')
})

describe('fällige Zahlungen', () => {
  it('zeigt erreichte Fälligkeiten, aber nicht nach Laufzeitende', async () => {
    const { faelligeZahlungen, folgetermin } = await import('./calc')
    const a = w({ naechsteFaelligkeit: '2026-11-01' })
    const b = w({ naechsteFaelligkeit: '2026-11-20' })
    const c = w({ naechsteFaelligkeit: '2026-11-01', status: 'gekuendigt', laufzeitEnde: '2026-10-31' })
    expect(faelligeZahlungen([a, b, c], STICHTAG)).toEqual([a])
    expect(folgetermin(new Date(2026, 0, 31), 'monatlich').getDate()).toBe(28)
  })
})
