import { expect, test } from '@playwright/test'
import { pinEingeben, speichern } from './hilfen'

test('Onboarding in Schritten mit Überspringen, PIN und Fortsetzen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'PIN festlegen' }).click()
  await pinEingeben(page, '2468'); await pinEingeben(page, '2468')
  await expect(page.getByRole('button', { name: 'PIN ändern' })).toBeVisible()
  await page.getByRole('button', { name: 'Bereich vollständig · weiter' }).click()

  await expect(page.getByRole('heading', { name: 'Dein Hauptkonto' })).toBeVisible()
  await page.getByRole('button', { name: '+ Hinzufügen' }).click()
  await page.locator('#f-name').fill('Girokonto')
  await page.locator('#f-anfangssaldo').fill('1.500,00')
  await speichern(page)
  await page.getByRole('button', { name: 'Bereich vollständig · weiter' }).click()
  await page.getByRole('button', { name: 'Später ergänzen' }).click()

  await expect(page.getByRole('heading', { name: 'Monatliche Einnahmen' })).toBeVisible()
  await page.getByRole('button', { name: '+ Hinzufügen' }).click()
  await page.locator('#f-name').fill('Gehalt')
  await page.locator('#f-betrag').fill('2000')
  await speichern(page)
  await page.getByRole('button', { name: 'Fertig für jetzt' }).click()

  await expect(page.getByText('2 von 12')).toBeVisible()
  await expect(page.getByText('vorläufig')).toBeVisible()
  await expect(page.locator('.gross')).toHaveText(/2\.000,00/)
  await expect(page.getByText('Deine Fixkosten sind noch nicht vollständig.')).toBeVisible()

  await page.getByRole('button', { name: 'Einrichtung fortsetzen' }).click()
  await expect(page.getByRole('heading', { name: 'Weitere Konten und Bargeld' })).toBeVisible()

  await page.reload()
  await expect(page.getByText('PIN eingeben')).toBeVisible()
  await pinEingeben(page, '1111')
  await expect(page.getByText('Falsche PIN')).toBeVisible()
  await pinEingeben(page, '2468')
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible()
})
