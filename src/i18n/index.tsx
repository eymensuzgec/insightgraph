import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Dict, Locale } from './types'

import en from './locales/en'
import tr from './locales/tr'
import es from './locales/es'
import fr from './locales/fr'
import de from './locales/de'
import ar from './locales/ar'
import it from './locales/it'
import pt from './locales/pt'
import ru from './locales/ru'
import zh from './locales/zh'

const DICTS: Record<Locale, Dict> = { en, tr, es, fr, de, ar, it, pt, ru, zh }

const STORAGE_KEY = 'ig:lang'

function normalizeLocale(input: string | null | undefined): Locale {
  const raw = (input || '').toLowerCase()
  if (raw.startsWith('tr')) return 'tr'
  if (raw.startsWith('es')) return 'es'
  if (raw.startsWith('fr')) return 'fr'
  if (raw.startsWith('de')) return 'de'
  if (raw.startsWith('ar')) return 'ar'
  if (raw.startsWith('it')) return 'it'
  if (raw.startsWith('pt')) return 'pt'
  if (raw.startsWith('ru')) return 'ru'
  if (raw.startsWith('zh')) return 'zh'
  return 'en'
}

type I18nCtx = {
  lang: Locale
  dir: 'ltr' | 'rtl'
  dict: Dict
  setLang: (l: Locale) => void
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return normalizeLocale(saved)
    return normalizeLocale(navigator.language)
  })

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const dict = DICTS[lang] || en

  const value = useMemo<I18nCtx>(() => ({
    lang,
    dir,
    dict,
    setLang: (l) => setLangState(l),
  }), [lang, dir, dict])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n must be used within I18nProvider')
  return v
}
