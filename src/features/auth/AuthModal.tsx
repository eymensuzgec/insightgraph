import React, { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/auth/store'

export function AuthModal({ onDone }: { onDone: () => void }) {
  const { dict } = useI18n()
  const auth = useAuthStore()

  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ tone: 'good' | 'warn' | 'neutral'; text: string } | null>(null)

  const tabs = useMemo(() => ([
    { value: 'signin', label: dict.auth.signin },
    { value: 'signup', label: dict.auth.signup },
    { value: 'forgot', label: dict.auth.forgot },
  ]), [dict])

  function mapError(code: string) {
    switch (code) {
      case 'bad_email': return 'E-posta formatı hatalı.'
      case 'short_password': return 'Şifre en az 6 karakter olmalı.'
      case 'exists': return 'Bu e-posta ile hesap zaten var.'
      case 'no_account': return 'Bu e-posta ile hesap bulunamadı.'
      case 'bad_password': return 'Şifre yanlış.'
      default: return dict.common.error
    }
  }

  function clearMsg() { setMsg(null) }

  function onSubmit() {
    clearMsg()

    if (tab === 'signin') {
      const r = auth.signIn(email, pw)
      if (!r.ok) return setMsg({ tone: 'warn', text: mapError(r.error) })
      setMsg({ tone: 'good', text: 'Giriş başarılı.' })
      onDone()
      return
    }

    if (tab === 'signup') {
      if (pw !== pw2) return setMsg({ tone: 'warn', text: 'Şifreler eşleşmiyor.' })
      const r = auth.signUp(email, pw)
      if (!r.ok) return setMsg({ tone: 'warn', text: mapError(r.error) })
      setMsg({ tone: 'good', text: 'Hesap oluşturuldu.' })
      onDone()
      return
    }

    if (tab === 'forgot') {
      if (pw.length < 6) return setMsg({ tone: 'warn', text: mapError('short_password') })
      if (pw !== pw2) return setMsg({ tone: 'warn', text: 'Şifreler eşleşmiyor.' })
      const r = auth.resetPassword(email, pw)
      if (!r.ok) return setMsg({ tone: 'warn', text: mapError(r.error) })
      setMsg({ tone: 'good', text: 'Şifre güncellendi. Şimdi giriş yapabilirsiniz.' })
      setTab('signin')
      setPw('')
      setPw2('')
      return
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/60">{dict.auth.hint}</div>

      <Tabs value={tab} onChange={(v) => setTab(v as any)} items={tabs} />

      <div className="space-y-3">
        <div>
          <div className="text-xs text-white/70 mb-1">{dict.auth.email}</div>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>

        {(tab === 'signin' || tab === 'signup' || tab === 'forgot') && (
          <div>
            <div className="text-xs text-white/70 mb-1">
              {tab === 'forgot' ? 'Yeni şifre' : dict.auth.password}
            </div>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••" />
          </div>
        )}

        {(tab === 'signup' || tab === 'forgot') && (
          <div>
            <div className="text-xs text-white/70 mb-1">
              {tab === 'forgot' ? 'Yeni şifre (tekrar)' : dict.auth.password2}
            </div>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••" />
          </div>
        )}

        {msg && (
          <div>
            <Badge tone={msg.tone === 'warn' ? 'warn' : msg.tone === 'good' ? 'good' : 'neutral'}>
              {msg.text}
            </Badge>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onDone}>{dict.common.close}</Button>
          <Button onClick={onSubmit}>{dict.auth.continue}</Button>
        </div>
      </div>
    </div>
  )
}
