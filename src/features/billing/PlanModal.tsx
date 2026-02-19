import React from 'react'
import { useI18n } from '@/i18n'
import { useBillingStore, type Plan } from '@/billing/store'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PRICES: Record<Plan, number> = {
  free: 0,
  plus: 9,
  ultra: 19,
}

export function PlanModal() {
  const { dict } = useI18n()
  const { plan, setPlan } = useBillingStore()

  const cards: Array<{ id: Plan; title: string; desc: string; feats: string[] }> = [
    {
      id: 'free',
      title: dict.billing.free,
      desc: 'Local-first analysis + projects. No limits (launch mode).',
      feats: [dict.billing.features.unlimited, dict.billing.features.export],
    },
    {
      id: 'plus',
      title: dict.billing.plus,
      desc: 'Advanced insights + priority graph tools (architecture ready).',
      feats: [dict.billing.features.advancedInsights, dict.billing.features.graphExport, dict.billing.features.export],
    },
    {
      id: 'ultra',
      title: dict.billing.ultra,
      desc: 'Cloud sync ready + team-ready structure (no billing yet).',
      feats: [dict.billing.features.cloudSync, dict.billing.features.advancedInsights, dict.billing.features.graphExport],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/70">{dict.billing.subtitle}</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c) => {
          const active = plan === c.id
          return (
            <div key={c.id} className="glass rounded-2xl p-4 border border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="mt-1 text-xs text-white/60">{c.desc}</div>
                </div>
                {active ? <Badge tone="good">{dict.billing.current}</Badge> : <Badge>{dict.billing.comingSoon}</Badge>}
              </div>

              <div className="mt-4">
                <div className="text-2xl font-semibold">${PRICES[c.id]} <span className="text-sm text-white/60">{dict.billing.perMonth}</span></div>
              </div>

              <div className="mt-4 space-y-2">
                {c.feats.map((f) => (
                  <div key={f} className="text-xs text-white/75">• {f}</div>
                ))}
              </div>

              <div className="mt-5">
                <Button
                  className="w-full"
                  variant={active ? 'ghost' : 'primary'}
                  onClick={() => setPlan(c.id)}
                >
                  {active ? dict.billing.current : dict.billing.choose}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-white/50">
        Note: Payments are not enabled. This is only the subscription & gating foundation.
      </div>
    </div>
  )
}
