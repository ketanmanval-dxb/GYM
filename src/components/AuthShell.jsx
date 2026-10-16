import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import Logo from './Logo'
import { ThemeToggle } from './ui'

export function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="ambient relative min-h-dvh overflow-x-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 h-[700px]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto grid max-w-6xl place-items-center px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-brand opacity-[0.12] blur-3xl" />
          <div className="glass p-6 sm:p-8">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </motion.div>
      </main>
    </div>
  )
}

export function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input className="input" {...props} />
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
    </motion.p>
  )
}
