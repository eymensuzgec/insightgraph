import { create } from 'zustand'
import { safeJsonParse } from '@/lib/storage'

export type Theme = 'dark' | 'light'
const KEY = 'ig:theme'

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('light', t === 'light')
  document.documentElement.style.colorScheme = t
}

export const useTheme = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: safeJsonParse<Theme>(localStorage.getItem(KEY), 'dark'),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, JSON.stringify(next))
    applyTheme(next)
    set({ theme: next })
  },
}))

export function initTheme() {
  const t = safeJsonParse<Theme>(localStorage.getItem(KEY), 'dark')
  applyTheme(t)
}
