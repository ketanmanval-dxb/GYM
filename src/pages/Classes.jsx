import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, MapPin, Users, CalendarX, Check, Flower2, Zap, Bike, Swords } from 'lucide-react'
import { PageHeader, EmptyState } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { classes as seed, classTypes, weekDays } from '../data/mock'

const typeMeta = {
  Yoga: { icon: Flower2, cls: 'text-[#A78BFA] bg-[#A78BFA]/[0.12]', glow: 'from-[#A78BFA]/20' },
  HIIT: { icon: Zap, cls: 'text-lime bg-lime/10', glow: 'from-lime/20' },
  Spin: { icon: Bike, cls: 'text-cyan bg-cyan/10', glow: 'from-cyan/20' },
  Boxing: { icon: Swords, cls: 'text-ember bg-ember/10', glow: 'from-ember/20' },
}

function todayKey() {
  const d = new Date().getDay() // 0 = Sun
  return weekDays[(d + 6) % 7]
}

export default function Classes() {
  const toast = useToast()
  const [day, setDay] = useState(todayKey)
  const [type, setType] = useState('All')
  const [list, setList] = useState(seed)
  const [mine, setMine] = useState(() => new Set())

  const shown = useMemo(() => list.filter((c) => c.day === day && (type === 'All' || c.type === type)).sort((a, b) => a.time.localeCompare(b.time)), [list, day, type])

  const book = (c) => {
    if (mine.has(c.id)) {
      setMine((m) => {
        const n = new Set(m)
        n.delete(c.id)
        return n
      })
      setList((l) => l.map((x) => (x.id === c.id ? { ...x, booked: x.booked - 1 } : x)))
      toast({ type: 'info', title: 'Booking cancelled', message: `Your spot in ${c.title} was released.` })
      return
    }
    if (c.booked >= c.capacity) {
      toast({ type: 'error', title: 'This class is full', message: 'No worries. We’ll ping you if a spot opens up.' })
      return
    }
    setMine((m) => new Set(m).add(c.id))
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, booked: x.booked + 1 } : x)))
    toast({ type: 'success', title: 'You’re booked! 🎉', message: `${c.title} · ${c.day} ${c.time} with ${c.coach}` })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Class booking"
        title="This week at PulseFit"
        subtitle="Reserve your spot in Yoga, HIIT, Spin and Boxing. Spots go fast!"
        action={mine.size > 0 && <span className="rounded-full bg-lime/10 px-3 py-1.5 text-sm font-semibold text-lime">{mine.size} booked</span>}
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {weekDays.map((d) => {
          const count = list.filter((c) => c.day === d).length
          const active = d === day
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`relative flex min-w-[64px] flex-1 flex-col items-center rounded-2xl border px-3 py-3 transition-colors ${
                active ? 'border-transparent text-[rgb(var(--on-accent))]' : 'border-line/10 text-muted hover:text-ink'
              }`}
              aria-pressed={active}
            >
              {active && <motion.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-lime" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative text-sm font-semibold">{d}</span>
              <span className="relative mt-0.5 text-[11px] opacity-70">{count} classes</span>
              {d === todayKey() && <span className={`relative mt-1 h-1 w-1 rounded-full ${active ? 'bg-current' : 'bg-lime'}`} />}
            </button>
          )
        })}
      </div>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {['All', ...classTypes].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`chip ${type === t ? 'chip-active' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={`No ${type === 'All' ? '' : type + ' '}classes on ${day}`}
          message="Take it as a sign for a rest day, or check another day of the week."
          action={<button onClick={() => setType('All')} className="btn-ghost">Show all classes</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {shown.map((c, i) => {
              const m = typeMeta[c.type]
              const Icon = m.icon
              const left = c.capacity - c.booked
              const full = left <= 0
              const isMine = mine.has(c.id)
              const fill = c.booked / c.capacity
              return (
                <motion.article
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`glass relative overflow-hidden p-5 transition-shadow hover:shadow-glow ${isMine ? '!border-lime/40' : ''}`}
                >
                  <div className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r ${m.glow} to-transparent opacity-50`} />
                  <div className="relative flex items-start gap-4">
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold leading-none">{c.time}</p>
                      <p className="mt-1 text-xs text-muted">{c.duration} min</p>
                    </div>
                    <div className="h-12 w-px bg-line/10" />
                    <div className="min-w-0 flex-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
                        <Icon className="h-3.5 w-3.5" /> {c.type} · {c.intensity}
                      </span>
                      <h3 className="mt-2 text-lg font-semibold leading-tight">{c.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span>{c.coach}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.room}</span>
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`flex items-center gap-1 font-semibold ${full ? 'text-danger' : left <= 3 ? 'text-ember' : 'text-muted'}`}>
                          <Users className="h-3.5 w-3.5" />
                          {full ? 'Class full' : `${left} spot${left === 1 ? '' : 's'} left`}
                        </span>
                        <span className="tabular-nums text-muted">{c.booked}/{c.capacity}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/[0.08]">
                        <motion.div
                          className={`h-full rounded-full ${full ? 'bg-danger' : left <= 3 ? 'bg-ember' : 'bg-lime'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${fill * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                        />
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => book(c)}
                      className={
                        isMine
                          ? 'btn-ghost !border-lime/40 !px-4 !py-2.5 text-sm text-lime'
                          : full
                            ? 'btn-ghost !px-4 !py-2.5 text-sm text-muted'
                            : 'btn-primary !px-5 !py-2.5 text-sm'
                      }
                    >
                      {isMine ? (
                        <>
                          <Check className="h-4 w-4" /> Booked
                        </>
                      ) : full ? (
                        'Waitlist'
                      ) : (
                        'Book'
                      )}
                    </motion.button>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted">
        <Clock className="h-3.5 w-3.5" /> Free cancellation up to 2 hours before class.
      </p>
    </div>
  )
}
