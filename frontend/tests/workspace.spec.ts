import { test, expect, type Page } from '@playwright/test'
import { demoSnapshot } from '../src/data/demo'

async function mockBackend(
  page: Page,
  options: { marketFailure?: boolean; agentFailure?: boolean } = {},
) {
  const documents: {
    document_id: number
    title: string
    source: string
    chunks_saved: number
    created_at: string
  }[] = []
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/auth/login') {
      expect(route.request().postDataJSON()).toHaveProperty('password', 'CorrectPassword123')
      return json({ access_token: 'test-session-token', token_type: 'bearer' })
    }
    if (path === '/auth/register')
      return json(
        { id: 1, email: 'curious@example.com', username: 'curious', is_active: true },
        201,
      )
    expect(route.request().headers().authorization).toBe('Bearer test-session-token')
    if (path === '/auth/me')
      return json({ id: 1, email: 'curious@example.com', username: 'curious', is_active: true })
    if (path === '/api/v1/market/overview') {
      if (options.marketFailure)
        return json({ detail: 'Market data is unavailable. Please retry shortly.' }, 503)
      return json({
        ...demoSnapshot,
        source: 'Test market provider',
        updated_at: new Date().toISOString(),
        assets: demoSnapshot.assets.map((a) => ({ ...a, updated_at: new Date().toISOString() })),
      })
    }
    if (path === '/api/v1/agent/analyze') {
      if (options.agentFailure)
        return route.fulfill({
          status: 502,
          contentType: 'text/plain',
          body: 'upstream unavailable',
        })
      return json({
        status: 'success',
        answer: '**Evidence first.**\nThe test fixture reports a price. Verify the timestamp.',
        tools_used: ['get_crypto_price'],
        sources: [],
      })
    }
    if (path === '/api/v1/rag/documents') return json({ documents })
    if (path === '/api/v1/rag/upload') {
      documents.push({
        document_id: 1,
        title: 'research.txt',
        source: 'research.txt',
        chunks_saved: 1,
        created_at: new Date().toISOString(),
      })
      return json({ status: 'success', document_id: 1, title: 'research.txt', chunks_saved: 1 })
    }
    if (path === '/api/v1/rag/documents/1' && route.request().method() === 'DELETE') {
      documents.splice(0)
      return route.fulfill({ status: 204 })
    }
    return json({ detail: 'Not found' }, 404)
  })
}

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill('curious@example.com')
  await page.getByLabel('Password', { exact: true }).fill('CorrectPassword123')
  await page.getByRole('button', { name: 'Step into your workspace' }).click()
  await expect(page).toHaveURL('/dashboard')
}

test('overview supports chart selection, watchlists, filtering, search and CSV export', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find the signal.')
  await expect(page.locator('.demo-banner')).toContainText('illustrative')
  await page.getByLabel('Chart asset').selectOption('ETH')
  await expect(page.locator('.chart-price')).toContainText('$3,521.64')
  await page.getByRole('button', { name: '24H', exact: true }).click()
  await expect(page.getByRole('button', { name: '24H', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Remove Ethereum from watchlist' }).click()
  await page.getByRole('button', { name: /Watchlist/ }).click()
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await page.getByLabel('Filter assets').fill('Solana')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export data' }).click()
  expect((await download).suggestedFilename()).toBe('cryptomind-demo.csv')
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('textbox', { name: 'Search your workspace' }).fill('Solana')
  await page.getByRole('dialog').getByRole('button', { name: 'Solana SOL' }).click()
  await expect(page.getByLabel('Chart asset')).toHaveValue('SOL')
  expect(errors).toEqual([])
  await page.getByRole('button', { name: 'All assets', exact: true }).click()
  await page.getByLabel('Filter assets').fill('')
  await page.getByLabel('Chart asset').selectOption('BTC')
  await page.getByRole('button', { name: '7D', exact: true }).click()
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement)?.blur()
    window.scrollTo(0, 0)
  })
  await page.screenshot({
    path: '../docs/screenshots/overview-desktop.png',
    fullPage: true,
    animations: 'disabled',
  })
})

test('mobile navigation and every main page fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/explore', '/explore/ai', '/explore/research', '/login']) {
    await page.goto(path)
    await expect(page.locator('h1')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
  await page.goto('/explore')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /AI studio/ })
    .click()
  await expect(page).toHaveURL('/explore/ai')
  await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/)
  await page.screenshot({
    path: '../docs/screenshots/studio-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})

test('demo prompts stay explicit and do not generate simulated AI answers', async ({ page }) => {
  await page.goto('/explore/ai')
  await page.getByRole('button', { name: 'Read the momentum' }).click()
  await expect(page.getByLabel('Ask CryptoMind a question')).toHaveValue(/RSI and MACD/)
  await page.getByRole('button', { name: 'Send question' }).click()
  await expect(page.getByRole('status')).toContainText('Demo mode does not generate answers')
  await expect(page.locator('.assistant-message')).toHaveCount(0)
})

test('protected routes redirect to sign-in and the login UI renders', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/dashboard/ai')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
  await page.getByLabel('Password', { exact: true }).fill('secret')
  await page.getByRole('button', { name: 'Show password' }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByLabel('Password', { exact: true }).fill('')
  await page.screenshot({
    path: '../docs/screenshots/signin-desktop.png',
    fullPage: true,
    animations: 'disabled',
  })
})

test('live sign-in, authenticated AI, document upload and removal work', async ({ page }) => {
  await mockBackend(page)
  await signIn(page)
  await expect(page.locator('.chart-price')).toContainText('$67,428.80')
  await expect(page.locator('.demo-banner')).toHaveCount(0)
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /AI studio/ })
    .click()
  await page.getByLabel('Ask CryptoMind a question').fill('What is the BTC price?')
  await page.getByRole('button', { name: 'Send question' }).click()
  await expect(page.locator('.assistant-message')).toContainText('Evidence first.')
  await expect(page.locator('.tool-tag')).toContainText('get crypto price')
  await page.getByRole('navigation').getByRole('link', { name: 'Research library' }).click()
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'research.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Bitcoin research notes.'),
    })
  await page.getByRole('button', { name: 'Add to research library', exact: true }).click()
  await expect(page.locator('.document-row')).toContainText('research.txt')
  await page.getByRole('button', { name: 'Remove research.txt' }).click()
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.locator('.document-row')).toHaveCount(0)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login')
  expect(await page.evaluate(() => localStorage.getItem('cryptomind_access_token'))).toBeNull()
})

test('provider and non-JSON agent errors stay actionable', async ({ page }) => {
  await mockBackend(page, { marketFailure: true, agentFailure: true })
  await signIn(page)
  await expect(page.getByRole('alert')).toContainText('Market feed needs attention')
  await expect(page.locator('.metric-value').first()).toContainText('—')
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /AI studio/ })
    .click()
  await page.getByLabel('Ask CryptoMind a question').fill('BTC?')
  await page.getByRole('button', { name: 'Send question' }).click()
  await expect(page.getByRole('alert')).toContainText('Request failed (502)')
  await page.getByRole('button', { name: 'Try this question again' }).click()
  await expect(page.getByLabel('Ask CryptoMind a question')).toHaveValue('BTC?')
})

test('expired sessions clear the token and return to sign-in', async ({ page }) => {
  await mockBackend(page)
  await signIn(page)
  await page.route('**/api/v1/agent/analyze', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Session expired' }),
    }),
  )
  await page.goto('/dashboard/ai')
  await page.getByLabel('Ask CryptoMind a question').fill('BTC?')
  await page.getByRole('button', { name: 'Send question' }).click()
  await expect(page).toHaveURL('/login')
  expect(await page.evaluate(() => localStorage.getItem('cryptomind_access_token'))).toBeNull()
})

test('registration uses the same authenticated workspace flow', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await page.getByLabel('Your username').fill('curious')
  await page.getByLabel('Email address').fill('curious@example.com')
  await page.getByLabel(/^Password/).fill('CorrectPassword123')
  await page.getByRole('button', { name: 'Create my workspace' }).click()
  await expect(page).toHaveURL('/dashboard')
})
