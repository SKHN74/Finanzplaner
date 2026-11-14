import { Dexie, type EntityTable } from 'dexie'
import type { Budget, Buchung, Einstellungen, Kategorie, Konto, Schuld, Sparziel, Wiederkehrend } from '../domain/types'

/** Name der Datenbank mit deinen echten Daten. */
export const DB_ECHT = 'finanzplaner'
/** Name der getrennten Datenbank für künstliche Testdaten. */
export const DB_TEST = 'finanzplaner-test'

export class FinanzDB extends Dexie {
  konten!: EntityTable<Konto, 'id'>
  kategorien!: EntityTable<Kategorie, 'id'>
  buchungen!: EntityTable<Buchung, 'id'>
  wiederkehrend!: EntityTable<Wiederkehrend, 'id'>
  schulden!: EntityTable<Schuld, 'id'>
  sparziele!: EntityTable<Sparziel, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  einstellungen!: EntityTable<Einstellungen, 'id'>

  constructor(name: typeof DB_ECHT | typeof DB_TEST) {
    super(name)
    // Version 1. Neue Felder ohne Index brauchen keine neue Version;
    // neue Indizes oder Umbauten bekommen version(2) mit upgrade().
    this.version(1).stores({
      konten: 'id, typ',
      kategorien: 'id, art',
      buchungen: 'id, datum, kontoId, kategorieId, wiederkehrendId',
      wiederkehrend: 'id, unterart, status, schuldId',
      schulden: 'id',
      sparziele: 'id',
      budgets: 'id, &kategorieId',
      einstellungen: 'id',
    })
  }
}

export const TABELLEN = ['konten', 'kategorien', 'buchungen', 'wiederkehrend', 'schulden', 'sparziele', 'budgets', 'einstellungen'] as const
