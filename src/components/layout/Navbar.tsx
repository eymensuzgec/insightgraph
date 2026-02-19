import React, { useState } from 'react'
import { useI18n } from '@/i18n'
import type { Locale } from '@/i18n/types'
import { useTheme } from '@/services/theme'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AuthModal } from '@/features/auth/AuthModal'
import { useAuthStore } from '@/auth/store'
import { PlanModal } from '@/features/billing/PlanModal'

const LOCALES: Array<{ value: Locale; label: string }> = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ar', label: 'العربية' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
]

export function Navbar({ onOpenStudio }: { onOpenStudio: () => void }) {
  const { dict, lang, setLang } = useI18n()
  const { toggle } = useTheme()
  const { user, signOut } = useAuthStore()

  const [authOpen, setAuthOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  return (
    <header className="h-14 px-4 flex items-center justify-between glass border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 grid place-items-center">IG</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{dict.app.name}</div>
            <div className="text-[11px] text-white/60 hidden md:block">{dict.app.tagline}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onOpenStudio}>
          {dict.nav.studio}
        </Button>

        <select
          className="h-9 rounded-xl bg-white/6 border border-white/10 px-3 text-sm"
          value={lang}
          onChange={(e) => setLang(e.target.value as Locale)}
          aria-label={dict.nav.language}
        >
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        <Button size="sm" variant="ghost" onClick={toggle} aria-label={dict.nav.theme}>
          ☾
        </Button>

        <Button size="sm" variant="ghost" onClick={() => window.open('#', '_blank')}>
          {dict.nav.github}
        </Button>

        <Button size="sm" variant="ghost" onClick={() => setPlanOpen(true)}>
          {dict.nav.plan}
        </Button>

        {!user ? (
          <Button size="sm" onClick={() => setAuthOpen(true)}>
            {dict.nav.login}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-white/70">{user.email}</div>
            <Button size="sm" variant="ghost" onClick={signOut}>
              {dict.nav.logout}
            </Button>
          </div>
        )}
      </div>

      <Modal open={authOpen} onClose={() => setAuthOpen(false)} title={dict.auth.title}>
        <AuthModal onDone={() => setAuthOpen(false)} />
      </Modal>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title={dict.billing.title} widthClass="w-[720px]">
        <PlanModal />
      </Modal>
    </header>
  )
}
