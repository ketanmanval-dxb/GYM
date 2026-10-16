import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function initialTheme() {
  try {
    return localStorage.getItem('pulsefit-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07090D' : '#F4F6F1')
    try {
      localStorage.setItem('pulsefit-theme', theme)
    } catch {
      /* storage unavailable — theme still works for this session */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

// Chart colors validated for each surface (see dataviz palette check).
export function useChartColors() {
  const { isDark } = useTheme()
  return isDark
    ? { series: ['#65A30D', '#0E9DBF', '#EF5F1F'], accent: '#C6FF3D', grid: 'rgba(255,255,255,0.06)', axis: '#8C96A8', tooltipBg: '#10141B' }
    : { series: ['#65A30D', '#0891B2', '#EA580C'], accent: '#65A30D', grid: 'rgba(14,17,22,0.07)', axis: '#5C6472', tooltipBg: '#FFFFFF' }
}
