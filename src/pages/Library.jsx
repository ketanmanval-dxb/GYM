import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Plus, Check, Timer, SearchX, Dumbbell, Loader2, Play } from 'lucide-react'
import { PageHeader, EmptyState, DifficultyBadge, SkeletonCard, Skeleton, ErrorState } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { api, useApi, today } from '../lib/api'

const muscleGroups = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

const groupTint = {
  Chest: 'from-lime/25',
  Back: 'from-cyan/25',
  Legs: 'from-ember/25',
  Arms: 'from-[#A78BFA]/25',
  Core: 'from-[#FFC94D]/25',
  Cardio: 'from-danger/25',
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCard key={i}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-3 h-3 w-full" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((j) => <Skeleton key={j} className="h-14" />)}
          </div>
          <Skeleton className="mt-4 h-11 w-full" />
        </SkeletonCard>
      ))}
    </div>
  )
}

export default function Library() {
  const date = useMemo(() => today(), [])
  const catalogue = useApi('/api/exercises')
  const todays = useApi(`/api/workouts?date=${date}`)
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('Any')
  const [pending, setPending] = useState(() => new Set())
  const toast = useToast()

  const exercises = catalogue.data?.exercises || []
  const workout = todays.data?.workout
  const added = useMemo(
    () => new Set(workout && workout.status !== 'completed' ? workout.exercises.map((e) => e.exercise_id) : []),
    [workout],
  )

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter(
      (e) =>
        (group === 'All' || e.muscle_group === group) &&
        (level === 'Any' || e.difficulty === level) &&
        (!q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    )
  }, [exercises, group, query, level])

  const toggleAdd = async (e) => {
    const isAdded = added.has(e.id)
    setPending((p) => new Set(p).add(e.id))
    // Optimistic: flip the button immediately, then sync with the server's version of today's workout.
    todays.setData((d) => {
      const w = d?.workout && d.workout.status !== 'completed' ? d.workout : { status: 'planned', exercises: [] }
      const exs = isAdded ? w.exercises.filter((x) => x.exercise_id !== e.id) : [...w.exercises, { exercise_id: e.id, sets: [] }]
      return { workout: { ...w, exercises: exs } }
    })
    try {
      const res = isAdded
        ? await api(`/api/workouts?exercise_id=${e.id}&date=${date}`, { method: 'DELETE' })
        : await api('/api/workouts', { method: 'POST', body: { exercise_id: e.id, date } })
      todays.setData({ workout: res.workout })
      toast(
        isAdded
          ? { type: 'info', title: 'Removed from today’s workout', message: e.name }
          : { type: 'success', title: 'Added to today’s workout 💪', message: `${e.name} · ${e.sets} × ${e.reps}` },
      )
    } catch (err) {
      todays.reload()
      toast({ type: 'error', title: isAdded ? 'Couldn’t remove that exercise' : 'Couldn’t add that exercise', message: err.message })
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(e.id)
        return n
      })
    }
  }

  const reset = () => {
    setGroup('All')
    setQuery('')
    setLevel('Any')
  }

  const error = catalogue.error || todays.error
  const retry = () => {
    catalogue.reload()
    todays.reload()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workout library"
        title="Find your next movement"
        subtitle={`${exercises.length || 'Dozens of'} coached exercises. Filter by muscle group and add them to today’s workout.`}
        action={
          added.size > 0 && (
            <Link to="/workout" className="inline-flex items-center gap-2 rounded-full bg-lime/10 px-3.5 py-1.5 text-sm font-semibold text-lime transition hover:bg-lime/20">
              {added.size} in today’s workout <Play className="h-3.5 w-3.5 fill-current" />
            </Link>
          )
        }
      />

      <div className="sticky top-[65px] z-30 -mx-4 mb-6 space-y-3 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="glass flex flex-1 items-center gap-3 !rounded-2xl px-4 py-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              aria-label="Search exercises"
            />
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="glass !rounded-2xl bg-transparent px-4 py-3 text-sm outline-none"
            aria-label="Difficulty"
          >
            {['Any', 'Beginner', 'Intermediate', 'Advanced'].map((l) => (
              <option key={l} value={l} className="bg-surface text-ink">
                {l === 'Any' ? 'Any difficulty' : l}
              </option>
            ))}
          </select>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Muscle group">
          {['All', ...muscleGroups].map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={group === g}
              onClick={() => setGroup(g)}
              className={`chip ${group === g ? 'chip-active' : ''}`}
            >
              {g}
              <span className="text-xs opacity-60">
                {g === 'All' ? exercises.length : exercises.filter((e) => e.muscle_group === g).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {catalogue.loading || todays.loading ? (
        <LibrarySkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="The library is empty"
          message="No exercises in the database yet. Run “npm run db:setup” to load the sample exercises."
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No exercises match"
          message="Try a different muscle group, difficulty or search term. We have plenty of other ways to make you sweat."
          action={<button onClick={reset} className="btn-ghost">Clear filters</button>}
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((e, i) => {
              const isAdded = added.has(e.id)
              const isPending = pending.has(e.id)
              return (
                <motion.article
                  layout
                  key={e.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                  whileHover={{ y: -4 }}
                  className="glass group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-glow"
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${groupTint[e.muscle_group]} to-transparent opacity-60`} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">{e.muscle_group}</p>
                      <h3 className="mt-1.5 text-lg font-semibold leading-tight">{e.name}</h3>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-line/[0.06]">
                      <Dumbbell className="h-5 w-5 text-muted" />
                    </span>
                  </div>
                  <p className="relative mt-2 line-clamp-2 text-sm text-muted">{e.description}</p>

                  <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Sets', e.sets],
                      ['Reps', e.reps],
                      ['Rest', `${e.rest_seconds}s`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-line/[0.04] px-2 py-2.5">
                        <p className="font-display text-lg font-bold leading-none">{v}</p>
                        <p className="mt-1 text-[11px] text-muted">{k}</p>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4 flex items-center justify-between">
                    <DifficultyBadge level={e.difficulty} />
                  </div>
                  <button
                    onClick={() => toggleAdd(e)}
                    disabled={isPending}
                    className={`relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isAdded
                        ? 'bg-lime text-[rgb(var(--on-accent))]'
                        : 'border border-line/10 hover:border-lime/50 hover:text-lime'
                    }`}
                    aria-pressed={isAdded}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAdded ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isAdded ? 'In today’s workout' : 'Add to today’s workout'}
                  </button>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted">
        <Timer className="h-3.5 w-3.5" /> Rest times auto-load into Live Workout mode.
      </p>
    </div>
  )
}
