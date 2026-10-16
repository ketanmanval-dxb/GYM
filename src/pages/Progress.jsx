import { useState } from 'react'
import { motion } from 'framer-motion'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { Trophy, TrendingUp, Table2, LineChart as LineIcon, Award } from 'lucide-react'
import { GlassCard, PageHeader, Counter } from '../components/ui'
import { useChartColors } from '../context/ThemeContext'
import { strengthHistory, lifts, personalRecords } from '../data/mock'

const tiers = {
  gold: { label: 'Gold', grad: 'from-[#FFE27A] to-[#F5A524]', text: 'text-[#F5A524]' },
  silver: { label: 'Silver', grad: 'from-[#F1F5F9] to-[#94A3B8]', text: 'text-[#94A3B8]' },
  bronze: { label: 'Bronze', grad: 'from-[#F8B98A] to-[#B8642F]', text: 'text-[#C9773E]' },
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[160px] rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-sm shadow-xl">
      <p className="mb-1.5 text-xs text-muted">Week {label.slice(1)} · est. 1RM</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.stroke }} />
            {lifts.find((l) => l.key === p.dataKey).label}
          </span>
          <span className="font-semibold tabular-nums">{p.value} kg</span>
        </p>
      ))}
    </div>
  )
}

export default function Progress() {
  const colors = useChartColors()
  const [visible, setVisible] = useState(() => new Set(lifts.map((l) => l.key)))
  const [view, setView] = useState('chart')
  const first = strengthHistory[0]
  const last = strengthHistory[strengthHistory.length - 1]
  const total = last.bench + last.squat + last.deadlift
  const gain = total - (first.bench + first.squat + first.deadlift)

  const toggle = (k) => {
    const next = new Set(visible)
    if (next.has(k) && next.size > 1) next.delete(k)
    else next.add(k)
    setVisible(next)
  }

  const endLabel = (key, color) =>
    function EndLabel({ x, y, index, value }) {
      if (index !== strengthHistory.length - 1) return null
      return (
        <text x={x - 6} y={y - 12} textAnchor="end" fontSize={12} fontWeight={600} style={{ fill: 'rgb(var(--ink))' }}>
          <tspan fill={color}>●</tspan> {lifts.find((l) => l.key === key).label.split(' ').pop()} {value}
        </text>
      )
    }

  return (
    <div>
      <PageHeader eyebrow="Progress" title="Stronger every week" subtitle="Estimated one-rep max across the big three lifts over the last 12 weeks." />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Big-3 total', total, 'kg', 1],
          ['12-week gain', gain, 'kg', 1],
          ['PRs this block', 9, '', 0],
          ['Consistency', 92, '%', 0],
        ].map(([label, v, unit, dec], i) => (
          <GlassCard key={label} delay={i * 0.05} className="!p-4">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold">
              {i === 1 && '+'}
              <Counter value={v} decimals={v % 1 ? dec : 0} />
              <span className="ml-1 text-base font-medium text-muted">{unit}</span>
            </p>
          </GlassCard>
        ))}
      </div>

      <GlassCard hover={false} delay={0.1} className="!p-4 sm:!p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-lime" />
            <h2 className="text-lg font-semibold">Strength gains</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2" aria-label="Lifts shown">
              {lifts.map((l, i) => (
                <button
                  key={l.key}
                  onClick={() => toggle(l.key)}
                  aria-pressed={visible.has(l.key)}
                  className={`chip !px-3 !py-1.5 ${visible.has(l.key) ? '!text-ink border-line/20' : 'opacity-50'}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.series[i] }} />
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-full border border-line/10 p-0.5">
              {[
                ['chart', LineIcon],
                ['table', Table2],
              ].map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`grid h-8 w-8 place-items-center rounded-full ${view === v ? 'bg-line/10 text-ink' : 'text-muted'}`}
                  aria-label={`${v} view`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === 'chart' ? (
          <div className="mt-6 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthHistory} margin={{ top: 24, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: colors.axis, fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: colors.axis, fontSize: 12 }}
                  domain={[60, 'dataMax + 10']}
                  unit=" kg"
                  width={64}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.axis, strokeOpacity: 0.4, strokeDasharray: '4 4' }} />
                {lifts.map((l, i) =>
                  visible.has(l.key) ? (
                    <Line
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      stroke={colors.series[i]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: colors.tooltipBg }}
                      animationDuration={1400}
                      animationBegin={i * 150}
                    >
                      <LabelList dataKey={l.key} content={endLabel(l.key, colors.series[i])} />
                    </Line>
                  ) : null,
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr>
                  <th className="py-2 font-medium">Week</th>
                  {lifts.map((l) => (
                    <th key={l.key} className="py-2 text-right font-medium">{l.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {strengthHistory.map((r) => (
                  <tr key={r.week} className="border-t border-line/[0.06]">
                    <td className="py-2">{r.week}</td>
                    {lifts.map((l) => (
                      <td key={l.key} className="py-2 text-right">{r[l.key]} kg</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="mb-4 mt-10 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[#F5A524]" />
        <h2 className="text-xl font-semibold">Personal records</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personalRecords.map((pr, i) => {
          const t = tiers[pr.tier]
          return (
            <motion.div
              key={pr.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass flex items-center gap-4 p-5 transition-shadow hover:shadow-glow"
            >
              <motion.span
                whileHover={{ rotate: [0, -12, 12, 0] }}
                className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${t.grad} text-[#1a1306] shadow-lg`}
              >
                <Trophy className="h-7 w-7" />
                <span className="absolute -bottom-1.5 rounded-full bg-surface px-1.5 text-[9px] font-bold uppercase tracking-wider text-ink ring-1 ring-line/10">
                  {t.label}
                </span>
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{pr.lift}</p>
                <p className="font-display text-2xl font-bold">{pr.value}</p>
                <p className="text-xs text-muted">
                  {pr.date} · <span className="font-semibold text-lime">{pr.delta}</span>
                </p>
              </div>
              {i === 0 && (
                <span className="flex items-center gap-1 self-start rounded-full bg-lime/10 px-2 py-1 text-[10px] font-bold uppercase text-lime">
                  <Award className="h-3 w-3" /> New
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
