import React from 'react'
import { useI18n } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const { dict } = useI18n()

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">{dict.onboarding.title}</div>
        <div className="mt-1 text-sm text-white/70">{dict.onboarding.subtitle}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-sm font-semibold">{dict.onboarding.privacyTitle}</div>
          <div className="mt-2 text-xs text-white/70">{dict.onboarding.privacyBody}</div>
          <div className="mt-3"><Badge>Client-side</Badge></div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-sm font-semibold">{dict.onboarding.analysisTitle}</div>
          <div className="mt-2 text-xs text-white/70">{dict.onboarding.analysisBody}</div>
          <div className="mt-3"><Badge>Fast</Badge></div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-sm font-semibold">{dict.onboarding.toolsTitle}</div>
          <div className="mt-2 text-xs text-white/70">{dict.onboarding.toolsBody}</div>
          <div className="mt-3"><Badge>Studio</Badge></div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>{dict.onboarding.start}</Button>
      </div>
    </div>
  )
}
