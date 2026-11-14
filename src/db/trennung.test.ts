import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, setzeModus, testdatenLoeschen } from './modus'
import { speichern } from './repo'
import { testdatenErzeugen } from '../testdata/generieren'
import type { Konto, Schuld } from '../domain/types'

describe('Trennung von echten und Testdaten', () => {
  beforeEach(async () => {
    setzeModus('echt')
    await db().delete(); await db().open()
    await testdatenLoeschen()
  })

  it('Testdaten lassen sich im echten Modus nicht erzeugen', async () => {
    await expect(testdatenErzeugen()).rejects.toThrow()
    expect(await db().konten.count()).toBe(0)
  })

  it('Testdaten landen nur in der Test-Datenbank und sind gekennzeichnet', async () => {
    setzeModus('test')
    await testdatenErzeugen()
    const konten = await db().konten.toArray()
    expect(konten.length).toBeGreaterThan(0)
    expect(konten.every(k => k.name.startsWith('[TEST] ') && k.datensatz === 'test')).toBe(true)
    setzeModus('echt')
    expect(await db().konten.count()).toBe(0)
  })

  it('Testdaten löschen lässt echte Daten unberührt', async () => {
    await speichern<Konto>('konten', { name: 'Mein Konto', typ: 'giro', anfangssaldo: 0, saldoStichtag: '2026-11-01', aktiv: true })
    setzeModus('test')
    await testdatenErzeugen()
    await testdatenLoeschen()
    expect(await db().konten.count()).toBe(0)
    setzeModus('echt')
    const echt = await db().konten.toArray()
    expect(echt.map(k => [k.name, k.datensatz])).toEqual([['Mein Konto', 'echt']])
  })

  it('Schuld mit Rate erscheint als wiederkehrende Rate und verschwindet beim Löschen', async () => {
    const { loeschen } = await import('./repo')
    const id = await speichern<Schuld>('schulden', { name: 'Kredit', restschuld: 100000, rate: 5000, zinssatz: 3 })
    expect((await db().wiederkehrend.where('schuldId').equals(id).first())?.betrag).toBe(5000)
    await loeschen('schulden', id)
    expect(await db().wiederkehrend.count()).toBe(0)
  })
})
