/**
 * KÜNSTLICHE TESTDATEN.
 * Alle Werte sind erfunden und tragen das Präfix „[TEST]“.
 * Sie werden ausschließlich in die getrennte Test-Datenbank geschrieben.
 */
import { aktuellerModus } from '../db/modus'
import { grundausstattung, speichern, einstellungenAendern } from '../db/repo'
import { toIso, heute } from '../domain/dates'
import { finanzmonat } from '../domain/period'
import { ONBOARDING_SCHRITTE, type Buchung, type Konto, type Schuld, type Sparziel, type Wiederkehrend, type Budget } from '../domain/types'

const c = (euro: number) => Math.round(euro * 100)

export async function testdatenErzeugen(): Promise<void> {
  if (aktuellerModus() !== 'test') throw new Error('Testdaten dürfen nur im Testmodus erzeugt werden.')
  await grundausstattung()
  await einstellungenAendern({ monatsbeginn: 1, onboarding: Object.fromEntries(ONBOARDING_SCHRITTE.map(s => [s, 'erledigt'])) })
  const h = heute()
  const tag = (offset: number, plus: number) => {
    const s = finanzmonat(h, 1, offset).start
    const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + plus)
    return toIso(offset === 0 && d > h ? h : d)
  }

  const konto = (name: string, typ: Konto['typ'], euro: number) =>
    speichern<Konto>('konten', { name, typ, anfangssaldo: c(euro), saldoStichtag: tag(2, 0), aktiv: true })
  const giro = await konto('Musterbank Girokonto', 'giro', 2100)
  const bar = await konto('Bargeld', 'bargeld', 120)
  const spar = await konto('Tagesgeld', 'spar', 3000)

  const w = (name: string, unterart: Wiederkehrend['unterart'], euro: number, intervall: Wiederkehrend['intervall'], kategorieId: string, extra: Partial<Wiederkehrend> = {}) =>
    speichern<Wiederkehrend>('wiederkehrend', { name, unterart, betrag: c(euro), intervall, status: 'aktiv', kontoId: giro, kategorieId, naechsteFaelligkeit: tag(-1, 0), ...extra })
  const gehalt = await w('Gehalt', 'einkommen', 2400, 'monatlich', 'kat-gehalt')
  const miete = await w('Miete', 'fixkosten', 850, 'monatlich', 'kat-wohnen')
  await w('Strom', 'fixkosten', 65, 'monatlich', 'kat-wohnen')
  await w('Internet', 'fixkosten', 35, 'monatlich', 'kat-wohnen')
  await w('Haftpflichtversicherung', 'versicherung', 78, 'jaehrlich', 'kat-versicherungen')
  await w('Kfz-Versicherung', 'versicherung', 120, 'quartal', 'kat-versicherungen')
  await w('Streaming-Abo', 'abo', 13.99, 'monatlich', 'kat-abos')
  await w('Musik-Abo', 'abo', 10.99, 'monatlich', 'kat-abos', { status: 'gekuendigt', laufzeitEnde: tag(-1, -1) })
  await w('Handyvertrag', 'vertrag', 25, 'monatlich', 'kat-abos', { kuendigungsfrist: '3 Monate zum Laufzeitende', laufzeitEnde: tag(-14, 0) })

  await speichern<Schuld>('schulden', { name: 'Ratenkredit', glaeubiger: '[TEST] Musterbank', ursprungsbetrag: c(5000), restschuld: c(3200), zinssatz: 5.9, rate: c(150) })
  await speichern<Schuld>('schulden', { name: 'Privatdarlehen', glaeubiger: '[TEST] Familie', ursprungsbetrag: c(800), restschuld: c(500) })

  await speichern<Sparziel>('sparziele', { name: 'Notgroschen', zielbetrag: c(5000), eingezahlt: c(3000), zieldatum: tag(-12, 0) })
  await speichern<Sparziel>('sparziele', { name: 'Urlaub', zielbetrag: c(1200), eingezahlt: c(350) })

  for (const [kategorieId, euro] of [['kat-lebensmittel', 350], ['kat-freizeit', 120], ['kat-mobilitaet', 100], ['kat-kleidung', 60]] as const) {
    await speichern<Budget>('budgets', { kategorieId, betrag: c(euro) })
  }

  const b = (offset: number, plus: number, art: Buchung['art'], euro: number, kategorieId: string | undefined, notiz: string, extra: Partial<Buchung> = {}) =>
    speichern<Buchung>('buchungen', { datum: tag(offset, plus), art, betrag: c(euro), kontoId: giro, kategorieId, notiz, ...extra })
  for (const o of [2, 1, 0]) {
    await b(o, 0, 'einnahme', 2400, 'kat-gehalt', 'Gehalt', { wiederkehrendId: gehalt })
    await b(o, 0, 'ausgabe', 850, 'kat-wohnen', 'Miete', { wiederkehrendId: miete })
  }
  const einzel: [number, number, Buchung['art'], number, string, string][] = [
    [2, 3, 'ausgabe', 96.4, 'kat-lebensmittel', 'Wocheneinkauf'], [2, 10, 'ausgabe', 112.2, 'kat-lebensmittel', 'Wocheneinkauf'],
    [2, 18, 'ausgabe', 95, 'kat-freizeit', 'Konzert'], [2, 20, 'ausgabe', 90, 'kat-mobilitaet', 'Tanken'],
    [2, 24, 'ausgabe', 60, 'kat-geschenke', 'Geburtstagsgeschenk'],
    [1, 2, 'ausgabe', 121.5, 'kat-lebensmittel', 'Wocheneinkauf'], [1, 12, 'ausgabe', 168.3, 'kat-lebensmittel', 'Großeinkauf'],
    [1, 8, 'ausgabe', 110, 'kat-freizeit', 'Restaurant'], [1, 15, 'ausgabe', 80, 'kat-mobilitaet', 'Tanken'],
    [1, 21, 'ausgabe', 35, 'kat-haushalt', 'Haushaltswaren'],
    [0, 1, 'ausgabe', 64.3, 'kat-lebensmittel', 'Wocheneinkauf'], [0, 4, 'ausgabe', 38.9, 'kat-lebensmittel', 'Bäckerei & Markt'],
    [0, 8, 'ausgabe', 52.15, 'kat-lebensmittel', 'Wocheneinkauf'], [0, 5, 'ausgabe', 24, 'kat-freizeit', 'Kino'],
    [0, 2, 'ausgabe', 45, 'kat-mobilitaet', 'Tanken'], [0, 7, 'ausgabe', 59.99, 'kat-kleidung', 'Jacke'],
    [0, 11, 'rueckerstattung', 59.99, 'kat-kleidung', 'Jacke zurückgeschickt'],
  ]
  for (const e of einzel) await b(...e)
  await b(0, 3, 'ausgabe', 40, 'kat-lebensmittel', 'Wochenmarkt (bar)', { kontoId: bar })
  await b(0, 1, 'umbuchung', 200, undefined, 'Sparen', { zielKontoId: spar })
}
