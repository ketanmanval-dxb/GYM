import { useId } from 'react'
import { Link } from 'react-router-dom'

export function PulseMark({ className = 'h-9 w-9' }) {
  // Unique per logo: a duplicate id would point at the copy inside the hidden sidebar on phones
  const gradientId = `pf-g${useId().replace(/:/g, '')}`
  return (
    <span className={`relative grid place-items-center rounded-xl bg-[#07090D] ring-1 ring-white/10 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C6FF3D" />
            <stop offset="1" stopColor="#22E4FF" />
          </linearGradient>
        </defs>
        <path
          d="M4 34h14l5-13 9 26 6-17 4 4h18"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="300"
          className="animate-pulseLine"
        />
      </svg>
    </span>
  )
}

export default function Logo({ to = '/', size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-2xl'
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="PulseFit home">
      <PulseMark className={size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'} />
      <span className={`font-display font-bold italic tracking-tighter ${text} text-gradient animate-shimmer`}>PulseFit</span>
    </Link>
  )
}
