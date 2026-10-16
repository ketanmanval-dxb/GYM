import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Dumbbell, Flame, Timer, Trophy, CalendarDays, Play, Sparkles, Check, DatabaseZap } from 'lucide-react'
import Logo from '../components/Logo'
import { LogoutButton } from '../components/Layout'
import { Counter, ProgressRing, ThemeToggle, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../lib/api'

// Illustration only: the phone mock-up shows an example session, not anyone's real data.
const demo = { streak: 12, title: 'Push Power', subtitle: 'Chest · Shoulders · Triceps' }

function LiveStats() {
  const { data, error, loading } = useApi('/api/stats')
  const stats = [
    { label: 'Members', value: data?.members },
    { label: 'Workouts completed', value: data?.workouts_completed },
    { label: 'Classes this week', value: data?.classes_this_week },
  ]
  return (
    <motion.div {...fade(0.32)} className="mt-12 border-t border-line/[0.08] pt-8">
      <dl className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dd className="font-display text-2xl font-bold sm:text-4xl">
              {loading ? (
                <Skeleton className="h-8 w-16 sm:h-10 sm:w-24" />
              ) : error ? (
                <span className="text-muted">—</span>
              ) : (
                <Counter value={s.value} compact={s.value > 9999} duration={2.2} />
              )}
            </dd>
            <dt className="mt-1 text-xs text-muted sm:text-sm">{s.label}</dt>
          </div>
        ))}
      </dl>
      {error && (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <DatabaseZap className="h-3.5 w-3.5 text-ember" /> Live stats are unavailable: {error.message}
        </p>
      )}
    </motion.div>
  )
}

const features = [
  { icon: Dumbbell, title: 'Smart workout library', text: '200+ coached movements, filtered by muscle group and difficulty.', to: '/library' },
  { icon: Timer, title: 'Live workout mode', text: 'Auto rest timers and one-tap set tracking. Built for sweaty thumbs.', to: '/workout' },
  { icon: Trophy, title: 'Progress & PRs', text: 'Watch your strength climb and collect trophies for every record.', to: '/progress' },
  { icon: CalendarDays, title: 'Class booking', text: 'Yoga, HIIT, Spin and Boxing. Reserve your spot in two taps.', to: '/classes' },
]

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] },
})

function PhoneMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-[290px] sm:w-[320px]"
    >
      <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
      <div className="animate-float rounded-[2.6rem] border border-line/10 bg-surface/80 p-3 shadow-2xl backdrop-blur-xl">
        <div className="rounded-[2rem] border border-line/[0.06] bg-bg/80 p-5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Today</span>
            <span className="flex items-center gap-1 text-ember">
              <Flame className="h-3.5 w-3.5" /> {demo.streak} days
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{demo.title}</p>
          <p className="text-xs text-muted">{demo.subtitle}</p>
          <div className="mt-5 flex justify-center">
            <ProgressRing value={3} max={5} size={150} stroke={12} delay={0.8}>
              <div>
                <p className="font-display text-3xl font-bold">60%</p>
                <p className="text-[11px] text-muted">3 of 5 exercises</p>
              </div>
            </ProgressRing>
          </div>
          <div className="mt-5 space-y-2">
            {['Bench Press · 4×6', 'Incline DB · 3×10', 'Weighted Dips · 3×8'].map((t, i) => (
              <div key={t} className="flex items-center justify-between rounded-xl bg-line/[0.04] px-3 py-2.5 text-sm">
                <span>{t}</span>
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full ${i < 2 ? 'bg-lime text-[#07090D]' : 'border border-line/20'}`}
                >
                  {i < 2 && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-gradient-brand py-3 text-center text-sm font-semibold text-[#07090D]">Rest · 0:45</div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="glass absolute -left-10 top-24 hidden !rounded-2xl !bg-surface/90 px-4 py-3 sm:block"
      >
        <p className="flex items-center gap-2 text-xs text-muted">
          <Trophy className="h-4 w-4 text-[#FFC94D]" /> New PR
        </p>
        <p className="font-display text-lg font-bold">Deadlift 180 kg</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="glass absolute -right-8 bottom-28 hidden !rounded-2xl !bg-surface/90 px-4 py-3 sm:block"
      >
        <p className="text-xs text-muted">This week</p>
        <p className="font-display text-lg font-bold">
          299 <span className="text-sm font-medium text-muted">active min</span>
        </p>
      </motion.div>
    </motion.div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const startTo = user ? '/dashboard' : '/signup'
  return (
    <div className="ambient relative min-h-dvh overflow-x-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 h-[900px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-line/[0.06] bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <Link to="/library" className="hover:text-ink">Workouts</Link>
            <Link to="/classes" className="hover:text-ink">Classes</Link>
            <Link to="/progress" className="hover:text-ink">Progress</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:block" title={user.email}>
                Hi, {user.full_name.split(' ')[0]}
              </span>
            )}
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/dashboard" className="btn-ghost !py-2.5">
                  Open app
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !py-2.5">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary hidden !py-2.5 sm:inline-flex">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <motion.span
            {...fade(0)}
            className="inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/10 px-3.5 py-1.5 text-xs font-semibold text-lime"
          >
            <Sparkles className="h-3.5 w-3.5" /> PulseFit 2.0 is here, with AI-tuned rest timers
          </motion.span>
          <motion.h1
            {...fade(0.08)}
            className="mt-6 text-[3.1rem] font-bold leading-[0.95] sm:text-7xl lg:text-[5.4rem]"
          >
            Train smarter.
            <br />
            <span className="text-gradient animate-shimmer">Get stronger.</span>
          </motion.h1>
          <motion.p {...fade(0.16)} className="mt-6 max-w-lg text-lg text-muted">
            PulseFit plans your workouts, tracks every rep, books your classes and keeps your streak alive.
            Your whole gym life, in one pulse.
          </motion.p>
          <motion.div {...fade(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={startTo} className="btn-primary group !px-7 !py-4 text-base">
              <Play className="h-4 w-4 fill-current" /> Start Your Workout
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to={user ? '/dashboard' : '/login'} className="btn-ghost !px-7 !py-4 text-base">
              {user ? 'View dashboard' : 'I already have an account'}
            </Link>
          </motion.div>

          <LiveStats />
        </div>

        <PhoneMock />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="eyebrow">Everything you need</p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold sm:text-5xl">Built for the way you actually train.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text, to }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            >
              <Link to={to} className="glass group block h-full p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime/10 text-lime transition-colors group-hover:bg-lime group-hover:text-[rgb(var(--on-accent))]">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lime">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-brand p-8 text-[#07090D] sm:p-14">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
          <h2 className="relative max-w-lg text-3xl font-bold sm:text-5xl">Your next PR starts today.</h2>
          <p className="relative mt-3 max-w-md font-medium opacity-80">Join the members who never skip leg day. Well, rarely.</p>
          <Link to={startTo} className="btn relative mt-8 bg-[#07090D] !px-7 !py-4 text-white hover:-translate-y-0.5">
            Start Your Workout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} PulseFit. Train smarter. Get stronger.</p>
        </div>
      </footer>
    </div>
  )
}
