import { expect, test } from '@playwright/test'
import { speichern, testmodusMitDaten } from './hilfen'

test('Testdaten bleiben getrennt und lassen sich restlos löschen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Fertig für jetzt' }).click()
  await page.goto('#/konten')
  await page.getByRole('button', { name: '+ Konto hinzufügen' }).click()
  await page.locator('#f-name').fill('Mein Konto')
  await page.locator('#f-anfangssaldo').fill('0')
  await speichern(page)

  await testmodusMitDaten(page)
  await page.goto('#/konten')
  await expect(page.getByText('Mein Konto', { exact: true })).toHaveCount(0)
  await expect(page.getByText('[TEST] Tagesgeld')).toBeVisible()

  await page.goto('#/einstellungen')
  await page.getByRole('button', { name: 'Testdaten löschen' }).click()
  await page.getByRole('button', { name: 'Wirklich alle Testdaten löschen?' }).click()
  await page.goto('#/konten')
  await expect(page.getByText(/\[TEST\]/)).toHaveCount(0)

  await page.goto('#/einstellungen')
  await page.getByRole('button', { name: 'Zu echten Daten' }).click()
  await page.goto('#/konten')
  await expect(page.locator('.eintrag .t')).toHaveText(['Mein Konto'])
})
