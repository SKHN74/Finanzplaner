import { createContext, useContext } from 'react'
import type { EditorTyp } from './felder'

export interface EditorAufruf {
  typ: EditorTyp
  /** Vorhandener Datensatz; bei budget die Kategorie-ID, bei einzahlung die Sparziel-ID. */
  id?: string
  vorgabe?: Record<string, string>
}

export const EditorKontext = createContext<(a: EditorAufruf) => void>(() => undefined)
export const useEditor = () => useContext(EditorKontext)
