import { create } from 'zustand'
import { safeJsonParse } from '@/lib/storage'

export type Plan = 'free' | 'plus' | 'ultra'

type BillingState = {
  plan: Plan
  setPlan: (p: Plan) => void
}

const KEY = 'ig:plan'

export const useBillingStore = create<BillingState>((set) => ({
  plan: safeJsonParse<Plan>(localStorage.getItem(KEY), 'free'),
  setPlan: (p) => {
    localStorage.setItem(KEY, JSON.stringify(p))
    set({ plan: p })
  },
}))

export function canAccess(_plan: Plan, _feature: string): boolean {
  // Launch mode: no limits yet
  return true
}
