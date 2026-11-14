# Finanzplaner

Persönliche Finanzmanagement-App als PWA (installierbar auf dem iPhone).
Alle Daten bleiben lokal auf dem Gerät (IndexedDB). Es gibt keinen Server und keine Cloud.

> Dieses Repository ist öffentlich. Es enthält nur Code und klar gekennzeichnete, künstliche Testdaten.
> Echte Finanzdaten werden erst nach der Installation direkt in der App eingetragen und verlassen das Gerät nicht.

## Grundsätze

- **App zuerst, Daten später:** Die App funktioniert mit leerem Datenbestand und führt beim ersten Start durch ein Onboarding.
- **Keine erfundenen Werte:** Fehlt eine Grundlage, rechnet die App nicht weiter, sondern zeigt einen Hinweis.
- **Testdaten getrennt:** Testdaten liegen in der eigenen Datenbank `finanzplaner-test`, tragen das Präfix `[TEST]` und lassen sich mit einem Klick löschen. Die echte Datenbank heißt `finanzplaner`.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/domain` | Datenmodell und Rechenkern (reine Funktionen, mit Tests) |
| `src/db` | Datenbank (Dexie/IndexedDB), Moduswechsel echt/test, Speichern und Löschen |
| `src/testdata` | Generator für künstliche `[TEST]`-Daten (nur im Testmodus) |
| `src/app` | Layout, Navigation, Hooks |
| `src/screens` | Bildschirme der App |

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Unit-Tests (Rechenkern, Datentrennung)
npm run e2e      # Oberflächentests im Browser, nur mit [TEST]-Daten
npm run build    # Produktions-Build inkl. Service Worker
```

## Veröffentlichung

Jeder Push auf `main` wird getestet und über GitHub Actions auf GitHub Pages veröffentlicht.
Einmalig nötig: unter *Settings → Pages* als Quelle „GitHub Actions“ wählen.
