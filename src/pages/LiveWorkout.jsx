import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Pause, Play, RotateCcw, Plus, SkipForward, Trophy, Timer, Dumbbell, ChevronDown, Library as LibraryIcon, Flag, Loader2, ListChecks } from 'lucide-react'
import { DifficultyBadge, EmptyState, ErrorState, Skeleton, SkeletonCard } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { api, useApi, today } from '../lib/api'

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`
const repsLabel = (reps) => (/^\d+([–-]\d+)?$/.test(reps) ? `${reps} reps` : reps)

function fireConfetti() {
  const colors = ['#C6FF3D', '#22E4FF', '#7DFFA8', '#FFFFFF', '#FF7A45']
  const end = Date.now() + 1600
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors, zIndex: 200 })
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 200 })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 200 })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

function RestTimer({ rest, onToggle, onReset, onAdd, onSkip }) {
  const size = 260
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = rest.total ? rest.remaining / rest.total : 0
  const idle = rest.total === 0

  return (
    <div className="glass relative flex flex-col items-center overflow-hidden px-5 pb-6 pt-7">
      <div className={`absolute inset-0 -z-0 transition-opacity duration-700 ${rest.running ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/20 blur-3xl" />
      </div>
      <p className="eyebrow relative">{idle ? 'Rest timer' : rest.running ? 'Resting…' : rest.remaining === 0 ? 'Go time!' : 'Paused'}</p>
      <div className="relative mt-4" style={{ width: size, height: size, maxWidth: '72vw', maxHeight: '72vw' }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="rest-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#C6FF3D" />
              <stop offset="1" stopColor="#22E4FF" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'rgb(var(--line) / 0.07)' }} strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#rest-g)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: rest.running ? 1 : 0.4, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(198,255,61,0.45))' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-6xl font-bold tabular-nums sm:text-7xl">{fmt(rest.remaining)}</p>
            <p className="mt-1 text-sm text-muted">{idle ? 'Tick a set to start' : `of ${fmt(rest.total)}`}</p>
          </div>
        </div>
      </div>
      <div className="relative mt-6 flex items-center gap-3">
        <button onClick={onReset} disabled={idle} className="btn-ghost !h-12 !w-12 !p-0" aria-label="Reset timer">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button onClick={onToggle} disabled={idle || rest.remaining === 0} className="btn-primary !h-16 !w-16 !rounded-full !p-0" aria-label={rest.running ? 'Pause' : 'Resume'}>
          {rest.running ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
        </button>
        <button onClick={onAdd} disabled={idle} className="btn-ghost !h-12 !px-3 text-sm" aria-label="Add 15 seconds">
          <Plus className="h-4 w-4" />15s
        </button>
        <button onClick={onSkip} disabled={idle || rest.remaining === 0} className="btn-ghost !h-12 !w-12 !p-0" aria-label="Skip rest">
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function LiveSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-9 w-56" />
      <Skeleton className="mb-6 mt-6 h-2.5 w-full !rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 space-y-3 lg:order-1">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="!rounded-2xl !p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
        <SkeletonCard className="order-1 grid h-[420px] place-items-center lg:order-2">
          <Skeleton className="h-52 w-52 !rounded-full" />
        </SkeletonCard>
      </div>
    </div>
  )
}

/** The interactive session. Mounted once per loaded workout, so local state starts from the server's. */
function Session({ workout, date, onClosed }) {
  const toast = useToast()
  const { setStreak } = useAuth()
  const items = workout.exercises
  const initial = () => Object.fromEntries(items.map((e) => [e.workout_exercise_id, e.sets.map((s) => s.completed)]))

  const [done, setDone] = useState(initial)
  const [open, setOpen] = useState(() => (items.find((e) => !e.sets.every((s) => s.completed)) || items[0]).workout_exercise_id)
  const [rest, setRest] = useState({ total: 0, remaining: 0, running: false })
  const [startedAt, setStartedAt] = useState(() => (workout.started_at ? Date.parse(workout.started_at) : null))
  const [elapsed, setElapsed] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [summary, setSummary] = useState(null)
  const celebrated = useRef(false)

  // Saves run one after another so a quick double-tap can never arrive out of order.
  const queue = useRef(Promise.resolve())
  const enqueue = useCallback((fn) => {
    const p = queue.current.then(fn)
    queue.current = p.catch(() => {})
    return p
  }, [])

  const complete = Boolean(summary)
  const totalSets = items.reduce((s, e) => s + e.sets.length, 0)
  const doneSets = Object.values(done).flat().filter(Boolean).length
  const progress = totalSets ? doneSets / totalSets : 0

  // Workout clock, based on when the workout was started (survives a page refresh).
  useEffect(() => {
    if (!startedAt || complete) return
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [startedAt, complete])

  // Rest countdown
  useEffect(() => {
    if (!rest.running) return
    const t = setInterval(() => {
      setRest((r) => (r.remaining <= 1 ? { ...r, remaining: 0, running: false } : { ...r, remaining: r.remaining - 1 }))
    }, 1000)
    return () => clearInterval(t)
  }, [rest.running])

  const restEnded = rest.total > 0 && rest.remaining === 0 && !rest.running
  useEffect(() => {
    if (restEnded && !complete) {
      toast({ type: 'info', title: 'Rest over. Next set!', message: 'Breathe in, brace, go.' })
      try {
        navigator.vibrate?.([120, 60, 120])
      } catch {
        /* vibration not supported */
      }
    }
  }, [restEnded]) // eslint-disable-line react-hooks/exhaustive-deps

  const elapsedRef = useRef(0)
  elapsedRef.current = elapsed

  const finish = useCallback(async () => {
    if (celebrated.current) return
    celebrated.current = true
    setFinishing(true)
    setRest({ total: 0, remaining: 0, running: false })
    try {
      const res = await enqueue(() =>
        api('/api/workouts', {
          method: 'PATCH',
          body: { workout_id: workout.id, action: 'finish', elapsed_seconds: elapsedRef.current, date },
        }),
      )
      setStreak(res.streak)
      setSummary({ minutes: res.duration_minutes, streak: res.streak.current })
      fireConfetti()
    } catch (err) {
      celebrated.current = false
      toast({ type: 'error', title: 'Couldn’t save your workout', message: `${err.message} Tap “Finish workout now” to try again.` })
    } finally {
      setFinishing(false)
    }
  }, [enqueue, workout.id, date, setStreak, toast])

  // Completing every set finishes the workout automatically.
  useEffect(() => {
    if (totalSets > 0 && doneSets === totalSets && !celebrated.current) finish()
  }, [doneSets, totalSets]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSet = (ex, idx) => {
    const key = ex.workout_exercise_id
    const wasDone = done[key][idx]
    const nextSets = done[key].map((v, i) => (i === idx ? !v : v))

    // Optimistic update: the tick shows instantly, the save happens in the background.
    setDone((d) => ({ ...d, [key]: d[key].map((v, i) => (i === idx ? !wasDone : v)) }))
    if (!wasDone && !startedAt) setStartedAt(Date.now())

    enqueue(() => api('/api/sets', { method: 'PATCH', body: { set_id: ex.sets[idx].id, completed: !wasDone } }))
      .then((row) => {
        if (row.started_at) setStartedAt((s) => s ?? Date.parse(row.started_at))
      })
      .catch((err) => {
        setDone((d) => ({ ...d, [key]: d[key].map((v, i) => (i === idx ? wasDone : v)) }))
        toast({ type: 'error', title: 'That set didn’t save', message: err.message })
      })

    if (!wasDone) {
      setRest({ total: ex.rest_seconds, remaining: ex.rest_seconds, running: ex.rest_seconds > 0 })
      if (nextSets.every(Boolean)) {
        const nextEx = items.find((e) => e.workout_exercise_id !== key && !done[e.workout_exercise_id].every(Boolean))
        if (nextEx) {
          toast({ type: 'success', title: `${ex.name} done ✅`, message: `Up next: ${nextEx.name}` })
          setOpen(nextEx.workout_exercise_id)
        }
      }
    }
  }

  const restart = () => {
    const before = done
    setDone(Object.fromEntries(items.map((e) => [e.workout_exercise_id, e.sets.map(() => false)])))
    setRest({ total: 0, remaining: 0, running: false })
    setElapsed(0)
    setStartedAt(null)
    setOpen(items[0].workout_exercise_id)
    enqueue(() => api('/api/workouts', { method: 'PATCH', body: { workout_id: workout.id, action: 'reset', date } }))
      .then(() => toast({ type: 'info', title: 'Workout reset', message: 'Fresh start. All sets cleared.' }))
      .catch((err) => {
        setDone(before)
        toast({ type: 'error', title: 'Couldn’t reset the workout', message: err.message })
      })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-lime ${startedAt && !complete ? 'animate-ping' : ''} opacity-75`} />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            Live workout
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{workout.name}</h1>
          <p className="mt-1 text-muted">{workout.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <div className="glass !rounded-2xl px-4 py-2.5 text-center">
            <p className="font-display text-xl font-bold tabular-nums">{fmt(elapsed)}</p>
            <p className="text-[11px] text-muted">Elapsed</p>
          </div>
          <div className="glass !rounded-2xl px-4 py-2.5 text-center">
            <p className="font-display text-xl font-bold tabular-nums">
              {doneSets}/{totalSets}
            </p>
            <p className="text-[11px] text-muted">Sets</p>
          </div>
        </div>
      </div>

      <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-line/[0.08]" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="h-full rounded-full bg-gradient-brand" animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 space-y-3 lg:order-1">
          {items.map((ex, i) => {
            const key = ex.workout_exercise_id
            const sets = done[key]
            const finished = sets.every(Boolean)
            const isOpen = open === key
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass overflow-hidden !rounded-2xl transition-colors ${isOpen ? 'border-lime/30' : ''}`}
              >
                <button onClick={() => setOpen(isOpen ? null : key)} className="flex w-full items-center gap-4 p-4 text-left" aria-expanded={isOpen}>
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display font-bold transition-colors ${
                      finished ? 'bg-lime text-[rgb(var(--on-accent))]' : 'bg-line/[0.06] text-muted'
                    }`}
                  >
                    {finished ? <Check className="h-5 w-5" strokeWidth={3} /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${finished ? 'text-muted line-through decoration-lime/60' : ''}`}>{ex.name}</p>
                    <p className="text-sm text-muted">
                      {sets.length} × {ex.reps} · rest {ex.rest_seconds}s
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-muted">
                    {sets.filter(Boolean).length}/{sets.length}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="border-t border-line/[0.06] px-4 pb-4 pt-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <DifficultyBadge level={ex.difficulty} />
                          <span className="text-xs text-muted">{ex.muscle_group}</span>
                        </div>
                        {ex.description && <p className="mb-3 text-sm text-muted">{ex.description}</p>}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {sets.map((v, idx) => (
                            <motion.button
                              key={ex.sets[idx].id}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => toggleSet(ex, idx)}
                              disabled={complete || finishing}
                              className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                                v ? 'border-lime/40 bg-lime/15' : 'border-line/10 hover:border-lime/40'
                              }`}
                              aria-pressed={v}
                            >
                              <span>
                                <span className="block text-xs text-muted">Set {idx + 1}</span>
                                <span className="font-display font-semibold">{repsLabel(ex.reps)}</span>
                              </span>
                              <span
                                className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
                                  v ? 'scale-100 bg-lime text-[rgb(var(--on-accent))]' : 'border border-line/20'
                                }`}
                              >
                                {v && <Check className="h-4 w-4" strokeWidth={3} />}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button onClick={restart} disabled={finishing || complete} className="btn-ghost flex-1 text-sm text-muted">
              <RotateCcw className="h-4 w-4" /> Reset workout
            </button>
            {doneSets > 0 && !complete && (
              <button onClick={finish} disabled={finishing} className="btn-ghost flex-1 text-sm">
                {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4 text-lime" />} Finish workout now
              </button>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-10">
            <RestTimer
              rest={rest}
              onToggle={() => setRest((r) => ({ ...r, running: !r.running }))}
              onReset={() => setRest((r) => ({ ...r, remaining: r.total, running: true }))}
              onAdd={() => setRest((r) => ({ ...r, total: r.total + 15, remaining: r.remaining + 15, running: true }))}
              onSkip={() => setRest((r) => ({ ...r, remaining: 0, running: false }))}
            />
          </div>
        </div>
      </div>

      {/* Completion modal */}
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-bg/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="glass w-full max-w-md !bg-surface/95 p-8 text-center"
              role="dialog"
              aria-label="Workout complete"
            >
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 14 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand text-[#07090D] shadow-glow"
              >
                <Trophy className="h-10 w-10" />
              </motion.div>
              <h2 className="mt-6 text-3xl font-bold">Workout crushed!</h2>
              <p className="mt-2 text-muted">
                {summary.streak > 1
                  ? `That’s day ${summary.streak} of your streak. Future you says thanks.`
                  : 'Day 1 of your streak. Future you says thanks.'}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  [Timer, `${summary.minutes} min`, 'Time'],
                  [ListChecks, `${doneSets}/${totalSets}`, 'Sets'],
                  [Dumbbell, items.length, 'Exercises'],
                ].map(([Icon, v, l]) => (
                  <div key={l} className="rounded-2xl bg-line/[0.05] py-3">
                    <Icon className="mx-auto h-4 w-4 text-lime" />
                    <p className="mt-1 font-display text-xl font-bold">{v}</p>
                    <p className="text-[11px] text-muted">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn-primary flex-1">See dashboard</Link>
                <button onClick={onClosed} className="btn-ghost flex-1">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LiveWorkout() {
  const date = useMemo(() => today(), [])
  const { data, error, loading, reload } = useApi(`/api/workouts?date=${date}`)

  if (loading) return <LiveSkeleton />
  if (error) return <div className="pt-4"><ErrorState error={error} onRetry={reload} /></div>

  const workout = data?.workout
  if (!workout || workout.exercises.length === 0) {
    return (
      <div className="pt-4">
        <EmptyState
          icon={Dumbbell}
          title="No workout yet today"
          message="Pick one from the Library! Add a few exercises and they’ll be waiting here with their sets and rest timers."
          action={
            <Link to="/library" className="btn-primary">
              <LibraryIcon className="h-4 w-4" /> Open the Library
            </Link>
          }
        />
      </div>
    )
  }

  if (workout.status === 'completed') {
    return (
      <div className="pt-4">
        <EmptyState
          icon={Trophy}
          title="Today’s workout is done 🎉"
          message={`${workout.name} took ${workout.duration_minutes} min and every rep counted. Fancy more? Add exercises from the Library to go again.`}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/dashboard" className="btn-primary">See dashboard</Link>
              <Link to="/library" className="btn-ghost">
                <Plus className="h-4 w-4" /> Plan another
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  return <Session key={workout.id} workout={workout} date={date} onClosed={reload} />
}
