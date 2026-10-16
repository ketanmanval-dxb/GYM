import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { AuthShell, Field, FormError } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(form.email, form.password)
      toast({ type: 'success', title: `Welcome back, ${user.full_name.split(' ')[0]} 👋`, message: 'Let’s keep that streak alive.' })
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      toast({ type: 'error', title: 'Couldn’t log you in', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to PulseFit"
      subtitle="Pick up right where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-lime hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <Field label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
        <FormError message={error} />
        <button type="submit" disabled={busy} className="btn-primary group w-full !py-3.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'Logging in…' : 'Log in'}
          {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>
    </AuthShell>
  )
}
