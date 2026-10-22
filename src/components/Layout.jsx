import { useState } from 'react'
import { NavLink, useOutlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Dumbbell, Timer, TrendingUp, CalendarDays, UserRound, Flame, LogOut } from 'lucide-react'
import Logo from './Logo'
import { ThemeToggle } from './ui'
import { useAuth, initialsOf } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function useLogout() {
  const { logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  return async () => {
    // Leave the protected page first, otherwise the auth guard sends us to /login
    navigate('/', { replace: true })
    try {
      await logout()
      toast({ type: 'info', title: 'Logged out', message: 'See you at your next session 👋' })
    } catch {
      toast({ type: 'error', title: 'Logout didn’t reach the server', message: 'You’ve been signed out on this device.' })
    }
  }
}

export function LogoutButton({ className = '' }) {
  const onLogout = useLogout()
  return (
    <button
      onClick={onLogout}
      className={`grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-line/[0.04] text-muted transition hover:border-danger/40 hover:text-danger ${className}`}
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-[18px] w-[18px]" />
    </button>
  )
}

function streakCopy(streak) {
  if (!streak || streak.current === 0) return { title: 'Start a streak', text: 'Finish a workout today to light it up.' }
  return {
    title: `${streak.current}-day streak`,
    text: streak.trainedToday ? 'Done for today. Nice work!' : 'Train today to keep it alive.',
  }
}

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/library', label: 'Workout Library', short: 'Library', icon: Dumbbell },
  { to: '/workout', label: 'Live Workout', short: 'Train', icon: Timer, primary: true },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: TrendingUp },
  { to: '/classes', label: 'Class Booking', short: 'Classes', icon: CalendarDays },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: UserRound },
]

function Sidebar() {
  const { user, streak } = useAuth()
  const s = streakCopy(streak)
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line/[0.07] bg-bg/60 px-4 py-6 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo to="/" />
      </div>
      <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors ${
                isActive ? 'text-ink' : 'text-muted hover:bg-line/[0.04] hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl border border-lime/20 bg-lime/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className={`relative h-[18px] w-[18px] ${isActive ? 'text-lime' : ''}`} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="glass !rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-ember" /> {s.title}
          </div>
          <p className="mt-1 text-xs text-muted">{s.text}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <Link to="/profile" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand font-display text-sm font-bold text-[#07090D]">
              {initialsOf(user.full_name)}
            </span>
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold leading-tight">{user.full_name}</span>
              <span className="block truncate text-xs text-muted">{user.email}</span>
            </span>
          </Link>
          <div className="flex shrink-0 gap-1.5">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <p className="px-1 text-[11px] text-muted">© {new Date().getFullYear()} PulseFit</p>
      </div>
    </aside>
  )
}

function MobileTopBar() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line/[0.06] bg-bg/70 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Logo to="/" />
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold sm:block">{user.full_name}</span>
        <ThemeToggle />
        <LogoutButton />
        <Link
          to="/profile"
          title={user.full_name}
          className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand font-display text-sm font-bold text-[#07090D]"
        >
          <span aria-hidden="true">{initialsOf(user.full_name)}</span>
          <span className="sr-only">Profile: {user.full_name}</span>
        </Link>
      </div>
    </header>
  )
}

function BottomNav() {
  const items = navItems.filter((i) => i.to !== '/profile')
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.07] bg-bg/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-end justify-between">
        {items.map(({ to, short, icon: Icon, primary }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} className="flex flex-col items-center gap-1 py-1">
              {({ isActive }) =>
                primary ? (
                  <>
                    <span className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-[#07090D] shadow-glow transition-transform active:scale-95">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className={`text-[11px] font-medium ${isActive ? 'text-lime' : 'text-muted'}`}>{short}</span>
                  </>
                ) : (
                  <>
                    <span className="relative grid h-8 w-12 place-items-center">
                      {isActive && (
                        <motion.span layoutId="bottom-active" className="absolute inset-0 rounded-full bg-lime/15" />
                      )}
                      <Icon className={`relative h-5 w-5 ${isActive ? 'text-lime' : 'text-muted'}`} />
                    </span>
                    <span className={`text-[11px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`}>{short}</span>
                  </>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Keeps the page that was on screen when this transition wrapper mounted. Without it, the
// fading-out wrapper would render the *new* route too, so every page mounted (and fetched) twice.
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

export default function Layout() {
  const location = useLocation()
  return (
    <div className="ambient min-h-dvh">
      <Sidebar />
      <MobileTopBar />
      <main className="pb-28 lg:pb-12 lg:pl-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10"
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
