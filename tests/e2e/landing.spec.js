import { test, expect } from '@playwright/test'
import { watchConsole, expectNoHorizontalScroll, expectAccessible } from './helpers.js'

test.describe('Landing page (logged out)', () => {
  let problems
  test.beforeEach(({ page }) => {
    problems = watchConsole(page)
  })
  test.afterEach(() => {
    expect(problems, problems.join('\n')).toEqual([])
  })

  test('loads with PulseFit in the tab title, navbar and headline', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/PulseFit/)
    const navbar = page.locator('header').first()
    await expect(navbar.getByRole('link', { name: 'PulseFit home' })).toBeVisible()
    await expect(navbar).toContainText('PulseFit')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Train smarter.')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Get stronger.')
  })

  test('stat counters animate up to the real database values', async ({ page }) => {
    // Record every value the "Classes this week" counter shows while it animates.
    await page.addInitScript(() => {
      window.__seen = []
      new MutationObserver(() => {
        const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent === 'Classes this week')
        const v = dt?.previousElementSibling?.textContent
        if (v && window.__seen.at(-1) !== v) window.__seen.push(v)
      }).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await page.goto('/')
    const classes = page.locator('dt', { hasText: 'Classes this week' }).locator('xpath=preceding-sibling::dd[1]')
    await expect(classes).toHaveText('10')
    const seen = await page.evaluate(() => window.__seen)
    expect(seen.length, `counter values seen: ${seen.join(', ')}`).toBeGreaterThan(2)
    expect(Number(seen[0])).toBeLessThan(10)
    for (const label of ['Members', 'Workouts completed']) {
      await expect(page.locator('dt', { hasText: label }).locator('xpath=preceding-sibling::dd[1]')).toHaveText(/^\d+$/)
    }
  })

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Start Your Workout/ }).first().click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })

  test('keyboard: Tab reaches "Start Your Workout" and Enter opens it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'keyboard navigation is a desktop check')
    await page.goto('/')
    let found = false
    for (let i = 0; i < 25 && !found; i++) {
      await page.keyboard.press('Tab')
      found = await page.evaluate(() => document.activeElement?.textContent?.includes('Start Your Workout'))
    }
    expect(found, 'Start Your Workout should be reachable with Tab').toBe(true)
    // The focus ring must be visible (outline from :focus-visible)
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('no horizontal scrolling and no accessibility problems', async ({ page }) => {
    for (const path of ['/', '/signup', '/login']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectNoHorizontalScroll(page)
      await expectAccessible(page, path)
    }
  })

  test('logged-out visitors are sent to login from protected pages', async ({ page }) => {
    for (const path of ['/dashboard', '/library', '/workout']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
    }
  })
})
