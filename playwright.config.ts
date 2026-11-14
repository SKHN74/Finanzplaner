import { defineConfig, devices } from '@playwright/test'

/**
 * Oberflächentests. Jeder Test läuft in einem frischen Browser-Profil,
 * berührt also nie die Daten auf einem echten Gerät.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173/', trace: 'off', ...devices['iPhone 13'], browserName: 'chromium' },
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: !process.env.CI, timeout: 120_000 },
})
