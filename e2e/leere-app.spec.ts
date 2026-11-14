import { expect, test } from '@playwright/test'

test('erster Start: Einrichtung öffnet sich, nichts wird erfunden', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Willkommen' })).toBeVisible()
  await page.getByRole('button', { name: 'Fertig für jetzt' }).click()
  await expect(page.getByText('Noch nicht berechenbar: Es fehlen deine monatlichen Einnahmen.')).toBeVisible()
  await expect(page.getByText('Füge deine monatlichen Einnahmen hinzu.')).toBeVisible()
  await expect(page.getByText('Deine Fixkosten sind noch nicht vollständig.')).toBeVisible()
  await expect(page.getByText('Dein Budget kann noch nicht vollständig berechnet werden.')).toBeVisible()
  await expect(page.getByText('Testmodus')).toHaveCount(0)
  for (const [tab, text] of [['Buchungen', 'noch keine Buchungen'], ['Verträge', 'Hier erscheinen Fixkosten'], ['Budget', 'Dein Budget kann noch nicht']] as const) {
    await page.getByRole('link', { name: tab }).click()
    await expect(page.getByText(text)).toBeVisible()
  }
})
