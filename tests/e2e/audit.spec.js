// Pre-launch audit: branding, layouts at phone/tablet/desktop, theme on every screen,
// navigation, Progress, Class Booking, Profile, quote of the day and empty states.
// Set AUDIT_EMAIL / AUDIT_PASSWORD to log in as an existing member instead of signing up.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { watchConsole, expectNoHorizontalScroll, uniqueEmail } from './helpers.js'

test.describe.configure({ mode: 'serial' })

const SCREENS = [
  { path: '/dashboard', nav: 'Dashboard' },
  { path: '/library', nav: 'Workout Library' },
  { path: '/workout', nav: 'Live Workout' },
  { path: '/progress', nav: 'Progress' },
  { path: '/classes', nav: 'Class Booking' },
  { path: '/profile', nav: 'Profile' },
]
const WIDTHS = [
  { name: 'phone', width: 375, height: 812, sidebar: false },
  { name: 'tablet', width: 768, height: 1024, sidebar: false },
  { name: 'desktop', width: 1440, height: 900, sidebar: true },
]

let context, page, problems

test.beforeAll(async ({ browser }, testInfo) => {
  const { defaultBrowserType, ...device } = testInfo.project.use // eslint-disable-line no-unused-vars
  context = await browser.newContext({ ...device })
  page = await context.newPage()
  problems = watchConsole(page)
})
test.afterAll(async () => {
  await context?.close()
})
test.afterEach(() => {
  expect(problems, problems.join('\n')).toEqual([])
})

const settle = async () => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200) // entrance animations
}

async function contrastProblems(label) {
  const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  return r.violations.flatMap((v) => v.nodes.map((n) => `${label}: ${n.target.join(' ')} ${n.any?.[0]?.message?.split('.')[0] || ''}`))
}

test('branding: tab title, favicon, hero, navbar and footer say PulseFit', async ({ request }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/PulseFit/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Train smarter.')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Get stronger.')
  await expect(page.getByRole('link', { name: 'PulseFit home' }).first()).toContainText('PulseFit')
  await expect(page.locator('footer')).toContainText('PulseFit')
  // Gradient logo: lime → cyan, and every logo has its own gradient id
  const grads = await page.locator('linearGradient[id^="pf-g"]').evaluateAll((gs) => gs.map((g) => ({ id: g.id, stops: [...g.children].map((x) => x.getAttribute('stop-color')) })))
  expect(grads.length).toBeGreaterThan(0)
  for (const g of grads) expect(g.stops).toEqual(['#C6FF3D', '#22E4FF'])
  expect(new Set(grads.map((g) => g.id)).size).toBe(grads.length)
  // Pulse favicon is linked and served
  const href = await page.locator('link[rel="icon"]').getAttribute('href')
  const res = await request.get(href)
  expect(res.ok()).toBe(true)
  const svg = await res.text()
  expect(svg).toContain('#C6FF3D')
  expect(svg).toContain('<path')
})

// eslint-disable-next-line no-empty-pattern
test('log in', async ({}, testInfo) => {
  if (process.env.AUDIT_EMAIL) {
    await page.goto('/login')
    await page.getByLabel('Email').fill(process.env.AUDIT_EMAIL)
    await page.getByLabel('Password', { exact: true }).fill(process.env.AUDIT_PASSWORD)
    await page.locator('button[type=submit]').click()
  } else {
    await page.goto('/signup')
    await page.getByLabel('Your name').fill('Audit Tester')
    await page.getByLabel('Email').fill(uniqueEmail(`audit-${testInfo.project.name}`))
    await page.getByLabel('Password', { exact: true }).fill('Test1234!')
    await page.locator('button[type=submit]').click()
  }
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('phone, tablet, desktop: right navigation, no sideways scroll, tappable nav', async () => {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w.width, height: w.height })
    for (const { path } of SCREENS) {
      await page.goto(path)
      await settle()
      await expectNoHorizontalScroll(page)
      const sidebar = page.locator('aside nav[aria-label="Main"]')
      const bottom = page.locator('nav.fixed[aria-label="Main"]')
      if (w.sidebar) {
        await expect(sidebar, `${w.name} ${path}: sidebar`).toBeVisible()
        await expect(bottom, `${w.name} ${path}: bottom bar hidden`).toBeHidden()
      } else {
        await expect(bottom, `${w.name} ${path}: bottom bar`).toBeVisible()
        await expect(sidebar, `${w.name} ${path}: sidebar hidden`).toBeHidden()
        for (const box of await bottom.getByRole('link').evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect().toJSON()))) {
          expect(box.width, `${w.name}: bottom-bar item width`).toBeGreaterThanOrEqual(44)
          expect(box.height, `${w.name}: bottom-bar item height`).toBeGreaterThanOrEqual(44)
        }
      }
    }
  }
})

// eslint-disable-next-line no-empty-pattern
test('every nav item opens the right screen', async ({}, testInfo) => {
  const desktop = !testInfo.project.name.startsWith('mobile')
  await page.setViewportSize(desktop ? { width: 1440, height: 900 } : { width: 375, height: 812 })
  await page.goto('/dashboard')
  for (const { path, nav } of SCREENS) {
    if (desktop) await page.locator('aside').getByRole('link', { name: nav }).click()
    else if (path === '/profile') await page.getByRole('link', { name: /^Profile:/ }).click()
    else await page.locator('nav.fixed[aria-label="Main"]').getByRole('link').nth(SCREENS.findIndex((s) => s.path === path)).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByText('Page not found')).toHaveCount(0)
  }
  // Every in-app link on every screen points at a real route
  const routes = new Set(['/', '/login', '/signup', ...SCREENS.map((s) => s.path)])
  for (const { path } of SCREENS) {
    await page.goto(path)
    await settle()
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
    for (const h of hrefs.filter((h) => h.startsWith('/'))) expect(routes.has(h.split(/[?#]/)[0]), `${path} links to ${h}`).toBe(true)
  }
})

test('light/dark toggle works on every screen and text stays readable', async () => {
  const issues = []
  for (const { path } of SCREENS) {
    await page.goto(path)
    await settle()
    const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/ }).locator('visible=true').first()
    await toggle.click()
    await expect(page.locator('html')).toHaveClass(/light/)
    await settle()
    issues.push(...(await contrastProblems(`${path} light`)))
    await page.getByRole('button', { name: 'Switch to dark mode' }).locator('visible=true').first().click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await settle()
    issues.push(...(await contrastProblems(`${path} dark`)))
  }
  expect(issues, issues.join('\n')).toEqual([])
})

test('Dashboard: quote of the day', async () => {
  await page.goto('/dashboard')
  await expect(page.getByText('Quote of the day')).toBeVisible()
  await expect(page.locator('blockquote')).not.toBeEmpty()
})

test('Progress: line chart and PR cards with trophy badges', async () => {
  await page.goto('/progress')
  await settle()
  await expect(page.locator('.recharts-line-curve').first()).toBeVisible()
  const prSection = page.getByRole('heading', { name: 'Personal records' }).locator('xpath=../..')
  const trophies = prSection.locator('svg.lucide-trophy')
  expect(await trophies.count()).toBeGreaterThan(1)
})

test('Class Booking: Book lowers spots and toasts; full classes cannot be booked', async () => {
  await page.goto('/classes')
  await page.getByRole('button', { name: /^Mon/ }).click()
  const card = (title) => page.locator('article').filter({ has: page.getByRole('heading', { name: title }) })

  const open = card('Sunrise Flow')
  await expect(open).toContainText('6 spots left')
  await open.getByRole('button', { name: 'Book' }).click()
  await expect(open).toContainText('5 spots left')
  await expect(open).toContainText('15/20')
  await expect(page.getByText('You’re booked!')).toBeVisible()

  const full = card('Metcon Blast')
  await expect(full).toContainText('Class full')
  await full.getByRole('button', { name: 'Waitlist' }).click()
  await expect(page.getByText('This class is full')).toBeVisible()
  await expect(full).toContainText('16/16')
  await expect(full.getByRole('button', { name: 'Booked' })).toHaveCount(0)
})

test('Profile: avatar, membership level and badges', async () => {
  await page.goto('/profile')
  await settle()
  await expect(page.locator('main .text-gradient').first()).not.toBeEmpty() // avatar initials
  await expect(page.getByText(/^LV \d+$/)).toBeVisible()
  await expect(page.getByText(/member$/).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Achievements & badges' })).toBeVisible()
  await expect(page.getByText(/\d+\/\d+ unlocked/)).toBeVisible()
})

test('empty states when a filter has no results', async () => {
  await page.goto('/library')
  await settle()
  const total = await page.locator('article').count()
  await page.getByLabel('Search exercises').fill('zzzz-nothing')
  await expect(page.getByText('No exercises match')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('article')).toHaveCount(total)

  await page.goto('/classes')
  await page.getByRole('button', { name: /^Mon/ }).click()
  await page.getByRole('button', { name: 'Boxing', exact: true }).click()
  await expect(page.getByText('No Boxing classes on Mon')).toBeVisible()
  await page.getByRole('button', { name: 'Show all classes' }).click()
  await expect(page.locator('article')).toHaveCount(3)
})
