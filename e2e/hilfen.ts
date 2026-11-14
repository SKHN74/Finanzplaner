import { expect, type Page } from '@playwright/test'

export async function pinEingeben(page: Page, pin: string) {
  for (const z of pin) await page.locator(`.tasten button[aria-label="${z}"]`).click()
}

/** Wechselt in den Testmodus und erzeugt die gekennzeichneten [TEST]-Daten. */
export async function testmodusMitDaten(page: Page) {
  await page.goto('#/einstellungen')
  await page.getByRole('button', { name: 'Zum Testmodus' }).click()
  await page.getByRole('button', { name: 'Testdaten neu erzeugen' }).click()
  await expect(page.getByRole('button', { name: 'Testdaten neu erzeugen' })).toBeEnabled()
  await expect(page.getByText('Testmodus · künstliche Daten')).toBeVisible()
}

export async function speichern(page: Page) {
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('.sheet')).toHaveCount(0)
}
