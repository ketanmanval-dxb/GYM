import { motion } from 'framer-motion'
import {
  Crown, MapPin, CalendarDays, Lock, Moon, Sun, Bell, ChevronRight, Sparkles,
  Dumbbell, Flame, Trophy, Sunrise, CalendarCheck, Medal, Zap, Timer, Award,
} from 'lucide-react'
import { GlassCard, Counter, ProgressRing } from '../components/ui'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { user, achievements, profileStats } from '../data/mock'

const Icons = { Dumbbell, Flame, Trophy, Sunrise, CalendarCheck, Medal, Zap, Timer, Crown, Award }

export default function Profile() {
  const { isDark, toggle } = useTheme()
  const toast = useToast()
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <div>
      {/* Hero card */}
      <GlassCard hover={false} className="!p-0">
        <div className="relative h-32 bg-gradient-brand sm:h-40">
          <div className="grid-bg absolute inset-0 opacity-40" />
          <Sparkles className="absolute right-6 top-6 h-6 w-6 text-[#07090D]/40" />
        </div>
        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative"
              >
                <ProgressRing value={user.xp} max={user.xpNext} size={116} stroke={6}>
                  <span className="grid h-[96px] w-[96px] place-items-center rounded-full bg-surface font-display text-3xl font-bold ring-4 ring-bg">
                    <span className="text-gradient">{user.initials}</span>
                  </span>
                </ProgressRing>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-[rgb(var(--on-accent))]">
                  LV {user.level}
                </span>
              </motion.div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
                <p className="text-sm text-muted">{user.handle}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-[#F5A524]/40 bg-[#F5A524]/10 px-4 py-2 text-sm font-semibold text-[#8A5200] dark:text-[#F5A524] sm:self-auto">
              <Crown className="h-4 w-4" /> {user.membership} member
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {user.homeGym}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Member since {user.memberSince}</span>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted">
              <span>Level {user.level}</span>
              <span className="tabular-nums">{user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/[0.08]">
              <motion.div className="h-full rounded-full bg-gradient-brand" initial={{ width: 0 }} animate={{ width: `${(user.xp / user.xpNext) * 100}%` }} transition={{ duration: 1.4, delay: 0.3 }} />
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {profileStats.map((s, i) => (
          <GlassCard key={s.label} delay={0.05 * i} className="!p-4 text-center">
            <p className="font-display text-3xl font-bold"><Counter value={s.value} /></p>
            <p className="text-sm text-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mb-4 mt-10 flex items-end justify-between">
        <h2 className="text-xl font-semibold">Achievements & badges</h2>
        <span className="text-sm text-muted">{unlocked}/{achievements.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {achievements.map((a, i) => {
          const Icon = Icons[a.icon] || Icons.Award
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={a.unlocked ? { y: -4, rotate: -1 } : undefined}
              className={`glass relative flex flex-col items-center p-5 text-center ${a.unlocked ? 'hover:shadow-glow' : ''}`}
            >
              <div
                className={`grid h-16 w-16 place-items-center rounded-2xl ${
                  a.unlocked ? 'bg-gradient-brand text-[#07090D] shadow-glow' : 'bg-line/[0.05] text-muted'
                }`}
              >
                {a.unlocked ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
              </div>
              <p className={`mt-3 font-display font-semibold ${a.unlocked ? '' : 'text-muted'}`}>{a.title}</p>
              <p className="mt-0.5 text-xs text-muted">{a.desc}</p>
              {!a.unlocked && (
                <div className="mt-3 w-full">
                  <div className="h-1.5 overflow-hidden rounded-full bg-line/[0.08]">
                    <motion.div className="h-full rounded-full bg-cyan" initial={{ width: 0 }} animate={{ width: `${a.progress * 100}%` }} transition={{ duration: 1, delay: 0.4 }} />
                  </div>
                  <p className="mt-1 text-[11px] tabular-nums text-muted">{Math.round(a.progress * 100)}%</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <h2 className="mb-4 mt-10 text-xl font-semibold">Settings</h2>
      <div className="glass divide-y divide-line/[0.06] !rounded-2xl">
        <button onClick={toggle} className="flex w-full items-center gap-3 px-5 py-4 text-left">
          {isDark ? <Moon className="h-5 w-5 text-cyan" /> : <Sun className="h-5 w-5 text-ember" />}
          <span className="flex-1 font-medium">Dark mode</span>
          <span className={`relative h-7 w-12 rounded-full transition-colors ${isDark ? 'bg-lime' : 'bg-line/15'}`}>
            <motion.span layout className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${isDark ? 'right-1' : 'left-1'}`} />
          </span>
        </button>
        <button
          onClick={() => toast({ type: 'error', title: 'Couldn’t reach notifications', message: 'Notification settings arrive in the next update. Hang tight!' })}
          className="flex w-full items-center gap-3 px-5 py-4 text-left"
        >
          <Bell className="h-5 w-5 text-lime" />
          <span className="flex-1 font-medium">Notifications</span>
          <ChevronRight className="h-4 w-4 text-muted" />
        </button>
      </div>
      <p className="mt-10 text-center text-xs text-muted">PulseFit v2.0 · Made for people who never skip leg day.</p>
    </div>
  )
}
