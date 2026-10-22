// The full member journey, in order, sharing one browser session:
// sign up → library filters → add 2 exercises → dashboard → live workout → finish → dashboard → refresh → logout.
import { test, expect } from '@playwright/test'
import { watchConsole, expectNoHorizontalScroll, expectAccessible, uniqueEmail } from './helpers.js'

test.describe.configure({ mode: 'serial' })

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']
const PICKS = ['Tempo Push-Up', 'Plank Hold'] // 3 sets each

let context, page, problems

test.beforeAll(async ({ browser }, testInfo) => {
  const { defaultBrowserType, ...device } = testInfo.project.use // eslint-disable-line no-unused-vars
  context = await browser.newContext({ ...device, baseURL: testInfo.config.projects[0].use.baseURL || 'http://localhost:4173' })
  page = await context.newPage()
  problems = watchConsole(page)
})
test.afterAll(async () => {
  await context?.close()
})
test.afterEach(() => {
  expect(problems, problems.join('\n')).toEqual([])
})

const card = (name) => page.locator('article').filter({ has: page.getByRole('heading', { name, exact: true }) })
const statOf = (label) => page.locator('dt', { hasText: label })

// eslint-disable-next-line no-empty-pattern
test('sign up (keyboard only) and land on the Dashboard', async ({}, testInfo) => {
  await page.goto('/signup')
  await page.getByLabel('Your name').focus()
  await page.keyboard.type('E2E Tester')
  await page.keyboard.press('Tab')
  await page.keyboard.type(uniqueEmail(testInfo.project.name))
  await page.keyboard.press('Tab')
  await page.keyboard.type('Test1234!')
  await page.keyboard.press('Enter') // submit the form from the keyboard
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E')
  await expect(page.getByText('No workout yet today.')).toBeVisible()
  // Navbar shows the user's name and a logout button.
  // Phones (no room for the full name) show the initials avatar, labelled with the full name.
  if (testInfo.project.name.startsWith('mobile')) {
    await expect(page.getByRole('link', { name: 'Profile: E2E Tester' })).toContainText('ET')
  } else {
    await expect(page.getByText('E2E Tester').first()).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectAccessible(page, 'dashboard (empty)')
})

test('Workout Library: every muscle-group filter shows only its cards', async () => {
  await page.goto('/library')
  await expect(page.locator('article')).toHaveCount(30)
  for (const g of GROUPS) {
    await page.getByRole('tab', { name: new RegExp(`^${g}`) }).click()
    await expect(page.locator('article')).toHaveCount(5)
    const eyebrows = await page.locator('article p.eyebrow').allTextContents()
    expect(eyebrows, `${g} filter`).toEqual(Array(5).fill(g))
  }
  await page.getByRole('tab', { name: /^All/ }).click()
  await expect(page.locator('article')).toHaveCount(30)
  await expectNoHorizontalScroll(page)
  await expectAccessible(page, 'library')
})

test('add 2 exercises to today’s workout', async () => {
  for (const name of PICKS) {
    const btn = card(name).getByRole('button', { name: /Add to today/ })
    await btn.click()
    await expect(card(name).getByRole('button', { name: /In today/ })).toHaveAttribute('aria-pressed', 'true')
  }
  await expect(page.getByRole('link', { name: /2 in today/ })).toBeVisible()
})

test('Dashboard shows today’s workout; Start opens Live Workout', async () => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Push Power' })).toBeVisible()
  await expect(page.getByText('2 exercises · 6 sets')).toBeVisible()
  for (const [i, name] of PICKS.entries()) await expect(page.getByText(`0${i + 1} ${name}`)).toBeVisible()
  // Each page must mount (and load its data) exactly once per visit.
  const loads = []
  const onRequest = (r) => r.url().includes('/api/workouts?date=') && loads.push(r.url())
  page.on('request', onRequest)
  await page.getByRole('link', { name: 'Start', exact: true }).click()
  await expect(page).toHaveURL(/\/workout$/)
  await expect(page.getByRole('button', { name: /^Set 1/ }).first()).toBeVisible()
  await page.waitForTimeout(800)
  page.off('request', onRequest)
  expect(loads, 'Live Workout should load today’s workout once').toHaveLength(1)
})

/** Clicks once the element has stopped moving (accordion/layout animations), like a person would. */
async function clickWhenSettled(locator) {
  let prev = null
  for (let i = 0; i < 30; i++) {
    const box = await locator.boundingBox()
    if (box && prev && box.x === prev.x && box.y === prev.y && box.height === prev.height) break
    prev = box
    await page.waitForTimeout(100)
  }
  await locator.click()
}

test('Live Workout: rest timer counts down, tick every set, finish with confetti', async () => {
  await expect(page.getByRole('heading', { name: 'Push Power' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectAccessible(page, 'live workout')

  const setButtons = page.getByRole('button', { name: /^Set \d/ })
  const timer = page.getByTestId('rest-remaining')

  // First tick starts the rest timer at the exercise's rest_seconds (Tempo Push-Up: 60 s)
  await clickWhenSettled(setButtons.first())
  await expect(page.getByText('1/6').first()).toBeVisible()
  await expect(timer).toHaveText(/^(1:00|0:59)$/)
  await page.waitForTimeout(2200)
  const later = await timer.textContent()
  expect(['0:58', '0:57', '0:56']).toContain(later)
  await expect(page.getByText('Resting…')).toBeVisible()

  // Tick the rest. Finishing an exercise opens the next one automatically.
  for (let done = 1; done < 6; done++) {
    // Only sets in the panel that is really open (a collapsing panel lingers during its animation)
    const next = page.locator('.glass:has(> button[aria-expanded="true"]) button[aria-pressed="false"]').filter({ hasText: /^Set \d/ }).first()
    if (done === 2) {
      // Regression: double-tapping the last set of an exercise must leave it ticked.
      await next.dblclick()
    } else {
      await clickWhenSettled(next)
    }
    // Like a person: wait until the tick has registered before the next tap.
    await expect(page.getByText(`${done + 1}/6`).first()).toBeVisible()
  }

  await expect(page.getByRole('dialog', { name: 'Workout complete' })).toBeVisible()
  await expect(page.getByText('Workout crushed!')).toBeVisible()
  await expect(page.locator('body > canvas')).toHaveCount(1) // canvas-confetti's canvas
  await expect(page.getByText('6/6')).toHaveCount(2) // header counter + modal
  await page.getByRole('link', { name: 'See dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

async function expectDashboardShowsWorkout() {
  await expect(page.getByText(/Today’s workout · Completed/)).toBeVisible()
  // Streak card
  const streak = page.locator('div', { has: page.getByText('Current streak', { exact: true }) }).last()
  await expect(streak.locator('p.font-display').first()).toHaveText('1')
  // Rings: 1 workout this week, minutes > 0, never NaN
  const rings = page.getByText('This week', { exact: true }).locator('xpath=ancestor::div[contains(@class,"glass")][1]')
  await rings.scrollIntoViewIfNeeded() // counters animate when they scroll into view
  await expect(rings).toContainText('/ 4')
  await expect(rings.locator('p.font-display').first()).toHaveText('1')
  await expect(rings).not.toContainText('NaN')
  // Weekly chart: today's bar has a height
  const chart = page.getByText('Last 7 days', { exact: true }).locator('xpath=ancestor::div[contains(@class,"glass")][1]')
  await chart.scrollIntoViewIfNeeded()
  await expect(chart.locator('p.font-display').first()).toHaveText(/^[1-9]\d* active minutes$/)
  await expect(chart.locator('.recharts-bar-rectangle path')).not.toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('NaN')
}

test('Dashboard updates: streak, chart and rings show the new workout', async () => {
  await expectDashboardShowsWorkout()
  await expectNoHorizontalScroll(page)
  await expectAccessible(page, 'dashboard (after workout)')
})

test('refresh: the data is still there', async () => {
  await page.reload()
  await expectDashboardShowsWorkout()
  await page.goto('/workout')
  await expect(page.getByRole('heading', { name: /Today’s workout is done/ })).toBeVisible()
  await page.goto('/library')
  await expect(page.locator('article')).toHaveCount(30)
})

test('every app page: no console errors, no sideways scroll, accessible, keyboard focusable', async () => {
  for (const path of ['/dashboard', '/library', '/workout', '/progress', '/classes', '/profile', '/no-such-page']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expectNoHorizontalScroll(page)
    await expectAccessible(page, path)
  }
  // Light theme too: contrast must hold in both themes
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  for (const path of ['/dashboard', '/library', '/workout']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expectAccessible(page, `${path} (light theme)`)
  }
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
})

test('logout, then protected pages redirect to login', async () => {
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
  for (const path of ['/dashboard', '/library', '/workout']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
  }
  // "Start Your Workout" goes to sign up again once logged out
  await page.goto('/')
  await page.getByRole('link', { name: /Start Your Workout/ }).first().click()
  await expect(page).toHaveURL(/\/signup$/)
})
