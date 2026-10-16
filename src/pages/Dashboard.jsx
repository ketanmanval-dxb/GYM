import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { Flame, Play, Timer, Dumbbell, Zap, CalendarDays, ChevronRight, CheckCircle2, Library as LibraryIcon, Plus } from 'lucide-react'
import { GlassCard, ProgressRing, QuoteCard, Counter, Skeleton, SkeletonCard, ErrorState } from '../components/ui'
import { useChartColors } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useApi, today as todayIso } from '../lib/api'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line/10 bg-surface px-3 py-2 text-sm shadow-xl">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold">{payload[0].value} active min</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      <SkeletonCard className="h-64 md:col-span-4" lines={4} />
      <SkeletonCard className="h-64 md:col-span-2" lines={2} />
      <SkeletonCard className="md:col-span-3">
        <Skeleton className="h-3 w-24" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mx-auto h-[104px] w-[104px] !rounded-full" />
          ))}
        </div>
      </SkeletonCard>
      <SkeletonCard className="md:col-span-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-7 w-40" />
        <div className="mt-4 flex h-36 items-end gap-3">
          {[40, 70, 25, 85, 55, 90, 35].map((h, i) => (
            <Skeleton key={i} className="flex-1 !rounded-b-none" style={{ height: `${h}%` }} />
          ))}
        </div>
      </SkeletonCard>
    </div>
  )
}

function TodayCard({ today }) {
  if (!today || today.exercises.length === 0) {
    return (
      <GlassCard className="md:col-span-4" hover={false}>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime/20 blur-3xl" />
        <div className="relative flex h-full flex-col items-start justify-center gap-4 py-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lime/10 text-lime">
            <Dumbbell className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">No workout yet today.</h2>
            <p className="mt-1 text-muted">Pick one from the Library! Add a few exercises and they’ll show up here.</p>
          </div>
          <Link to="/library" className="btn-primary !px-7">
            <LibraryIcon className="h-4 w-4" /> Browse the Library
          </Link>
        </div>
      </GlassCard>
    )
  }

  const completed = today.status === 'completed'
  const minutes = completed ? today.duration_minutes : today.est_minutes
  return (
    <GlassCard className="md:col-span-4 !p-0" hover={false}>
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
            {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />} Today’s workout ·{' '}
            {completed ? 'Completed' : today.status === 'in_progress' ? 'In progress' : 'Ready'}
          </span>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">{today.name}</h2>
          <p className="mt-1 text-muted">{today.subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5"><Timer className="h-4 w-4 text-cyan" /> {completed ? '' : '~'}{minutes} min</span>
            <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4 text-lime" /> {today.exercises.length} exercises · {today.total_sets} sets</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-ember" /> {today.done_sets}/{today.total_sets} sets done</span>
          </div>
        </div>
        {completed ? (
          <Link to="/library" className="btn-ghost !px-6 !py-4 text-base">
            <Plus className="h-4 w-4" /> Plan another
          </Link>
        ) : (
          <Link to="/workout" className="btn-primary !px-8 !py-4 text-base">
            <Play className="h-4 w-4 fill-current" /> {today.status === 'in_progress' ? 'Resume' : 'Start'}
          </Link>
        )}
      </div>
      <div className="no-scrollbar relative flex gap-2 overflow-x-auto border-t border-line/[0.06] px-6 py-4">
        {today.exercises.map((e, i) => (
          <span key={e.workout_exercise_id} className="flex shrink-0 items-center gap-2 rounded-xl bg-line/[0.04] px-3 py-2 text-sm">
            <span className="font-display text-xs font-bold text-muted">{String(i + 1).padStart(2, '0')}</span> {e.name}
          </span>
        ))}
      </div>
    </GlassCard>
  )
}

function trendBadge(last7, prev7) {
  if (prev7 > 0) {
    const pct = Math.round(((last7 - prev7) / prev7) * 100)
    return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}% vs last week`
  }
  return last7 > 0 ? 'First week on the board' : 'Let’s get moving'
}

export default function Dashboard() {
  const colors = useChartColors()
  const date = useMemo(() => todayIso(), [])
  const { data, error, loading, reload } = useApi(`/api/dashboard?date=${date}`)
  const { setStreak } = useAuth()
  const ringColors = ['lime', 'cyan', 'ember']

  useEffect(() => {
    if (data?.streak) setStreak(data.streak)
  }, [data, setStreak])

  const header = (name) => (
    <div className="mb-6 md:mb-8">
      <p className="eyebrow mb-2">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <h1 className="text-3xl font-bold sm:text-4xl">
        {greeting()}{name ? `, ${name}` : ''} <span className="inline-block origin-bottom-right animate-[float_2s_ease-in-out_infinite]">👋</span>
      </h1>
    </div>
  )

  if (loading) return <div>{header()}<DashboardSkeleton /></div>
  if (error) return <div>{header()}<ErrorState error={error} onRetry={reload} /></div>

  const { user, today, weekly, last7Minutes, prev7Minutes, streak, rings, nextClass } = data
  const streakPct = streak.best ? (streak.current / streak.best) * 100 : 0
  const nextStart = nextClass && new Date(nextClass.start_time)

  return (
    <div>
      {header(user.full_name.split(' ')[0])}

      <div className="grid gap-4 md:grid-cols-6">
        {/* Today's workout */}
        <TodayCard today={today} />

        {/* Streak */}
        <GlassCard className="md:col-span-2" delay={0.05}>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ember/20 to-transparent" />
          <div className="relative flex h-full flex-col">
            <p className="eyebrow">Current streak</p>
            <div className="mt-3 flex items-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="grid h-14 w-14 place-items-center rounded-2xl bg-ember/15"
              >
                <Flame className="h-8 w-8 fill-ember/40 text-ember" />
              </motion.span>
              <p className="font-display text-6xl font-bold leading-none">
                <Counter value={streak.current} duration={1.2} />
              </p>
              <span className="self-end pb-1 text-muted">{streak.current === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="mt-auto pt-6">
              <div className="flex justify-between text-xs text-muted">
                <span>Best: {streak.best} {streak.best === 1 ? 'day' : 'days'}</span>
                <span>
                  {streak.current === 0
                    ? 'Finish a workout to start'
                    : streak.current >= streak.best
                      ? 'Personal best 🔥'
                      : `${streak.best - streak.current} to beat it`}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FFB547] to-ember"
                  initial={{ width: 0 }}
                  animate={{ width: `${streakPct}%` }}
                  transition={{ duration: 1.4, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Rings */}
        <GlassCard className="md:col-span-3" delay={0.1} hover={false}>
          <div className="flex items-center justify-between">
            <p className="eyebrow">This week</p>
            <span className="text-xs text-muted">Goal: {user.weekly_goal_workouts} workouts · {user.weekly_goal_minutes} min</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {rings.map((r, i) => (
              <div key={r.key} className="flex flex-col items-center">
                <ProgressRing value={r.value} max={r.goal} size={104} stroke={9} color={ringColors[i]} delay={0.2 + i * 0.15}>
                  <div>
                    <p className="font-display text-xl font-bold">
                      <Counter value={r.value} duration={1.4} />
                    </p>
                    <p className="text-[10px] text-muted">/ {r.goal}</p>
                  </div>
                </ProgressRing>
                <p className="mt-2 text-center text-xs font-medium sm:text-sm">{r.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Weekly chart */}
        <GlassCard className="md:col-span-3" delay={0.15} hover={false}>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Last 7 days</p>
              <p className="mt-1 font-display text-2xl font-bold">
                <Counter value={last7Minutes} /> <span className="text-sm font-medium text-muted">active minutes</span>
              </p>
            </div>
            <span className="rounded-full bg-lime/10 px-2.5 py-1 text-xs font-semibold text-lime">{trendBadge(last7Minutes, prev7Minutes)}</span>
          </div>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 8, right: 0, left: -28, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: colors.axis, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: colors.axis, fontSize: 11 }} width={48} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.grid }} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={200}>
                  {weekly.map((d) => (
                    <Cell key={d.date} fill={d.date === date ? colors.accent : colors.series[0]} fillOpacity={d.date === date ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Quote + next class */}
        <div className="md:col-span-3">
          <QuoteCard delay={0.2} />
        </div>
        <GlassCard className="md:col-span-3" delay={0.25}>
          <Link to="/classes" className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Next class</p>
              <ChevronRight className="h-4 w-4 text-muted" />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan/10 text-cyan">
                <CalendarDays className="h-6 w-6" />
              </span>
              {nextClass ? (
                <div>
                  <p className="font-display text-xl font-semibold">{nextClass.title}</p>
                  <p className="text-sm text-muted">
                    {nextStart.toLocaleDateString('en', { weekday: 'short' })} ·{' '}
                    {nextStart.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} · {nextClass.coach_name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <Timer className="h-3 w-3" /> {nextClass.duration_minutes} min · {nextClass.intensity} intensity · {nextClass.capacity} spots
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-display text-xl font-semibold">No more classes this week</p>
                  <p className="text-sm text-muted">New classes drop every Monday.</p>
                </div>
              )}
            </div>
            <span className="mt-auto pt-4 text-sm font-semibold text-lime">See the timetable →</span>
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
