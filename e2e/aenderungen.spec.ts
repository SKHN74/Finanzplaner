import { expect, test } from '@playwright/test'
import { speichern, testmodusMitDaten } from './hilfen'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await testmodusMitDaten(page)
})

test('Testdaten sind gekennzeichnet und rechnen korrekt', async ({ page }) => {
  await page.goto('#/')
  await expect(page.locator('.kachel').filter({ hasText: 'Einnahmen' })).toContainText('2.400,00')
  await page.getByRole('link', { name: 'Verträge' }).click()
  // Liste erst nach dem Laden der Daten auslesen (allTextContents wartet nicht)
  await expect(page.locator('.eintrag .t')).toHaveCount(10)
  const namen = await page.locator('.eintrag .t').allTextContents()
  expect(namen.every(n => n.startsWith('[TEST] '))).toBe(true)
})

test('Netflix kündigen: Status ändern wirkt auf die Fixkosten', async ({ page }) => {
  await page.goto('#/')
  const fix = page.locator('.kachel').filter({ hasText: 'Fixkosten' }).locator('.wert')
  const vorher = await fix.textContent()
  await page.getByRole('link', { name: 'Verträge' }).click()
  await page.getByText('[TEST] Streaming-Abo').click()
  await page.locator('#f-status').selectOption('gekuendigt')
  await page.locator('#f-laufzeitEnde').fill('2020-01-01')
  await speichern(page)
  await page.getByRole('link', { name: 'Übersicht' }).click()
  await expect(fix).not.toHaveText(vorher!)
  await expect(fix).toHaveText(/1\.182,49/)
})

test('Neuer Handyvertrag, neue Anschaffung und Rückerstattung', async ({ page }) => {
  await page.goto('#/')
  const ausgaben = page.locator('.kachel').filter({ hasText: 'Ausgaben bisher' }).locator('.wert')
  await expect(ausgaben).toHaveText(/264,35/)

  await page.getByRole('button', { name: 'Neu erfassen' }).click()
  await page.locator('.sheet').getByText('Ausgabe', { exact: true }).click()
  await page.locator('#f-betrag').fill('100')
  await page.locator('#f-kategorieId').selectOption('kat-haushalt')
  await page.locator('#f-notiz').fill('Kaffeemaschine')
  await speichern(page)
  await expect(ausgaben).toHaveText(/364,35/)

  await page.getByRole('button', { name: 'Neu erfassen' }).click()
  await page.locator('.sheet').getByText('Rückerstattung', { exact: true }).click()
  await page.locator('#f-betrag').fill('40')
  await page.locator('#f-kategorieId').selectOption('kat-haushalt')
  await speichern(page)
  await expect(ausgaben).toHaveText(/324,35/)

  await page.getByRole('button', { name: 'Neu erfassen' }).click()
  await page.locator('.sheet').getByText('Vertrag oder Abo').click()
  await page.locator('#f-name').fill('Neuer Handyvertrag')
  await page.locator('#f-betrag').fill('20')
  await speichern(page)
  await page.getByRole('link', { name: 'Verträge' }).click()
  await expect(page.getByText('[TEST] Neuer Handyvertrag')).toBeVisible()
})

test('Gehalt ändern aktualisiert die Übersicht, Löschen entfernt den Eintrag', async ({ page }) => {
  await page.goto('#/vertraege')
  await page.getByText('[TEST] Gehalt').click()
  await page.locator('#f-betrag').fill('2.600,00')
  await speichern(page)
  await page.getByRole('link', { name: 'Übersicht' }).click()
  await expect(page.locator('.kachel').filter({ hasText: 'Einnahmen' })).toContainText('2.600,00')

  await page.getByRole('link', { name: 'Verträge' }).click()
  await page.getByText('[TEST] Internet').click()
  await page.getByRole('button', { name: 'Löschen' }).click()
  await page.getByRole('button', { name: /Wirklich löschen/ }).click()
  await expect(page.getByText('[TEST] Internet')).toHaveCount(0)
})

test('Eingabefehler werden verständlich gemeldet', async ({ page }) => {
  await page.goto('#/konten')
  await page.getByRole('button', { name: '+ Konto hinzufügen' }).click()
  await speichern(page).catch(() => undefined)
  await expect(page.getByRole('alert')).toHaveText('Bitte „Name“ ausfüllen.')
  await page.locator('#f-name').fill('X')
  await page.locator('#f-anfangssaldo').fill('abc')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('alert')).toContainText('kein gültiger Betrag')
})
