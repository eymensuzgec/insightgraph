import { create } from 'zustand'
import { safeJsonParse, uid } from '@/lib/storage'

export type User = {
  id: string
  email: string
  createdAt: number
}

type AuthState = {
  user: User | null
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  signUp: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  requestReset: (email: string) => { ok: true } | { ok: false; error: string }
  resetPassword: (email: string, newPassword: string) => { ok: true } | { ok: false; error: string }
  signOut: () => void
}

type StoredAuth = {
  users: Array<{ id: string; email: string; password: string; createdAt: number }>
  currentUserId: string | null
}

const KEY = 'ig:auth'

function load(): StoredAuth {
  return safeJsonParse<StoredAuth>(localStorage.getItem(KEY), { users: [], currentUserId: null })
}

function save(v: StoredAuth) {
  localStorage.setItem(KEY, JSON.stringify(v))
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    const st = load()
    const u = st.users.find(x => x.id === st.currentUserId)
    return u ? { id: u.id, email: u.email, createdAt: u.createdAt } : null
  })(),

  signIn: (email, password) => {
    const st = load()
    const found = st.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!found) return { ok: false as const, error: 'no_account' }
    if (found.password !== password) return { ok: false as const, error: 'bad_password' }
    st.currentUserId = found.id
    save(st)
    set({ user: { id: found.id, email: found.email, createdAt: found.createdAt } })
    return { ok: true as const }
  },

  signUp: (email, password) => {
    if (!validEmail(email)) return { ok: false as const, error: 'bad_email' }
    if (password.length < 6) return { ok: false as const, error: 'short_password' }
    const st = load()
    const exists = st.users.some(u => u.email.toLowerCase() === email.toLowerCase())
    if (exists) return { ok: false as const, error: 'exists' }
    const id = uid('user')
    st.users.push({ id, email, password, createdAt: Date.now() })
    st.currentUserId = id
    save(st)
    set({ user: { id, email, createdAt: Date.now() } })
    return { ok: true as const }
  },

  requestReset: (email) => {
    const st = load()
    const found = st.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!found) return { ok: false as const, error: 'no_account' }
    // demo: in real system we'd email a token
    return { ok: true as const }
  },

  resetPassword: (email, newPassword) => {
    if (newPassword.length < 6) return { ok: false as const, error: 'short_password' }
    const st = load()
    const idx = st.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
    if (idx < 0) return { ok: false as const, error: 'no_account' }
    st.users[idx].password = newPassword
    save(st)
    return { ok: true as const }
  },

  signOut: () => {
    const st = load()
    st.currentUserId = null
    save(st)
    set({ user: null })
  },
}))
