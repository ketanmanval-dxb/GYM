import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Target, Timer } from 'lucide-react'
import { AuthShell, Field, FormError } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const WORKOUT_GOALS = [2, 3, 4, 5, 6]
const MINUTE_GOALS = [90, 150, 180, 240, 300]

function GoalPicker({ icon: Icon, label, options, value, onChange, unit }) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-4 w-4 text-lime" /> {label}
      </legend>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`chip ${value === o ? 'chip-active' : ''}`}
          >
            {o}
            {unit && <span className="text-xs opacity-80">{unit}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function Signup() {
  const { signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', weekly_goal_workouts: 4, weekly_goal_minutes: 180 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await signup(form)
      toast({ type: 'success', title: `Welcome to PulseFit, ${user.full_name.split(' ')[0]}! 🎉`, message: 'Pick a few exercises to build today’s workout.' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      toast({ type: 'error', title: 'Couldn’t create your account', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Start your streak"
      title="Create your account"
      subtitle="Set your weekly goals and we’ll track every rep towards them."
      footer={
        <>
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Your name" autoComplete="name" required value={form.full_name} onChange={set('full_name')} placeholder="Alex Rivera" />
        <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={set('password')}
          placeholder="At least 8 characters"
        />
        <div className="space-y-4 rounded-2xl border border-line/[0.08] bg-line/[0.03] p-4">
          <p className="eyebrow">Weekly goals</p>
          <GoalPicker
            icon={Target}
            label="Workouts per week"
            options={WORKOUT_GOALS}
            value={form.weekly_goal_workouts}
            onChange={(v) => setForm((f) => ({ ...f, weekly_goal_workouts: v }))}
          />
          <GoalPicker
            icon={Timer}
            label="Active minutes per week"
            options={MINUTE_GOALS}
            unit="min"
            value={form.weekly_goal_minutes}
            onChange={(v) => setForm((f) => ({ ...f, weekly_goal_minutes: v }))}
          />
        </div>
        <FormError message={error} />
        <button type="submit" disabled={busy} className="btn-primary group w-full !py-3.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Creating account…' : 'Create account'}
          {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>
    </AuthShell>
  )
}
