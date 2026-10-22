import { expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/** Records console errors/warnings and uncaught exceptions for a page. */
export function watchConsole(page) {
  const problems = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`[${msg.type()}] ${msg.text()} (${page.url()})`)
  })
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message} (${page.url()})`))
  return problems
}

export async function expectNoHorizontalScroll(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, `page is ${scrollWidth}px wide on a ${innerWidth}px screen: ${page.url()}`).toBeLessThanOrEqual(innerWidth)
}

/** WCAG 2.1 A/AA checks: labels, alt text, contrast, ARIA, etc. */
export async function expectAccessible(page, label) {
  // Let entrance animations finish so contrast is measured on the final colours.
  await page.waitForTimeout(1200)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
        .slice(0, 4)
        .map((n) => `${n.target.join(' ')}  ${n.any?.[0]?.message?.split('.')[0] || ''}`)
        .join('\n    ')}`,
  )
  expect(summary, `Accessibility problems on ${label}:\n${summary.join('\n')}`).toEqual([])
}

export const uniqueEmail = (project) => `e2e-${project}-${Date.now()}@pulsefit.test`

export const isMobile = (testInfo) => testInfo.project.name.startsWith('mobile')
