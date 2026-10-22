import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { Moon, Sun, Quote, DatabaseZap, AlertTriangle, RotateCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { quoteOfTheDay } from '../data/mock'
import { isConnectionError } from '../lib/api'
import { ringFraction } from '../lib/progress'

export function GlassCard({ children, className = '', hover = true, delay = 0, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4 } : undefined}
      className={`glass relative overflow-hidden p-5 ${hover ? 'transition-shadow hover:shadow-glow' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function Counter({ value, duration = 1.6, decimals = 0, compact = false, suffix = '', className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setDisplay })
    return () => controls.stop()
  }, [inView, value, duration])

  const fmt = compact
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(display)
    : display.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {fmt}
      {suffix}
    </span>
  )
}

export function ProgressRing({ value, max, size = 120, stroke = 10, color = 'lime', children, delay = 0 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = ringFraction(value, max)
  const id = `ring-${color}`
  const grads = {
    lime: ['#C6FF3D', '#7DFFA8'],
    cyan: ['#22E4FF', '#5B8CFF'],
    ember: ['#FFB547', '#FF5C70'],
  }
  const [a, b] = grads[color] || grads.lime
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'rgb(var(--line) / 0.08)' }} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${a}66)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={`relative grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-line/[0.04] text-muted transition hover:text-ink ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <motion.span key={isDark ? 'moon' : 'sun'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </motion.span>
    </button>
  )
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-lime/10 text-lime">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

export function Skeleton({ className = '', ...rest }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" {...rest} />
}

/** A glass card filled with shimmering placeholder lines. */
export function SkeletonCard({ className = '', lines = 3, children }) {
  return (
    <div className={`glass p-5 ${className}`} aria-busy="true" aria-label="Loading">
      {children || (
        <>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-2/3" />
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={`mt-3 h-3 ${i % 2 ? 'w-1/2' : 'w-5/6'}`} />
          ))}
        </>
      )}
    </div>
  )
}

/** Friendly error card. Connection problems get a dedicated database message. */
export function ErrorState({ error, onRetry }) {
  const offline = isConnectionError(error)
  return (
    <EmptyState
      icon={offline ? DatabaseZap : AlertTriangle}
      title={offline ? 'Can’t reach the database' : 'Something went wrong'}
      message={error?.message || 'Please try again in a moment.'}
      action={
        onRetry && (
          <button onClick={onRetry} className="btn-primary">
            <RotateCw className="h-4 w-4" /> Try again
          </button>
        )
      }
    />
  )
}

export function QuoteCard({ delay = 0 }) {
  const q = quoteOfTheDay()
  return (
    <GlassCard delay={delay} hover={false} className="flex h-full flex-col justify-between">
      <Quote className="absolute -right-3 -top-3 h-24 w-24 rotate-180 text-lime/[0.07]" />
      <p className="eyebrow">Quote of the day</p>
      <blockquote className="mt-3 font-display text-lg font-medium leading-snug sm:text-xl">“{q.text}”</blockquote>
      <p className="mt-3 text-sm text-muted">— {q.author}</p>
    </GlassCard>
  )
}

export const difficultyMeta = {
  Beginner: { level: 1, cls: 'text-lime bg-lime/10' },
  Intermediate: { level: 2, cls: 'text-cyan bg-cyan/10' },
  Advanced: { level: 3, cls: 'text-ember bg-ember/10' },
}

export function DifficultyBadge({ level }) {
  const m = difficultyMeta[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2.5 w-1 rounded-full ${i <= m.level ? 'bg-current' : 'bg-current opacity-25'}`} />
        ))}
      </span>
      {level}
    </span>
  )
}
