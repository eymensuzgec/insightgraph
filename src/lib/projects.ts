import { create } from 'zustand'
import { safeJsonParse, uid } from '@/lib/storage'

export type Project = {
  id: string
  name: string
  text: string
  updatedAt: number
}

type State = {
  projects: Project[]
  activeId: string
  setActive: (id: string) => void
  createProject: () => void
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void
  updateText: (id: string, text: string) => void
}

const KEY = 'ig:projects'
const ACTIVE = 'ig:activeProjectId'

function loadProjects(): Project[] {
  const list = safeJsonParse<Project[]>(localStorage.getItem(KEY), [])
  if (list.length) return list
  const first: Project = { id: uid('p'), name: 'Untitled', text: '', updatedAt: Date.now() }
  return [first]
}

function saveProjects(p: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

function loadActive(defaultId: string) {
  return safeJsonParse<string>(localStorage.getItem(ACTIVE), defaultId)
}

function saveActive(id: string) {
  localStorage.setItem(ACTIVE, JSON.stringify(id))
}

export const useProjectsStore = create<State>((set, get) => {
  const projects = loadProjects()
  const activeId = loadActive(projects[0].id)
  return {
    projects,
    activeId,

    setActive: (id) => {
      saveActive(id)
      set({ activeId: id })
    },

    createProject: () => {
      const p: Project = { id: uid('p'), name: 'New project', text: '', updatedAt: Date.now() }
      const next = [p, ...get().projects]
      saveProjects(next)
      saveActive(p.id)
      set({ projects: next, activeId: p.id })
    },

    renameProject: (id, name) => {
      const next = get().projects.map(p => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p))
      saveProjects(next)
      set({ projects: next })
    },

    deleteProject: (id) => {
      const curr = get().projects
      const next = curr.filter(p => p.id !== id)
      const fallback = next.length ? next[0].id : uid('p')
      const final = next.length ? next : [{ id: fallback, name: 'Untitled', text: '', updatedAt: Date.now() }]
      saveProjects(final)
      saveActive(final[0].id)
      set({ projects: final, activeId: final[0].id })
    },

    updateText: (id, text) => {
      const next = get().projects.map(p => (p.id === id ? { ...p, text, updatedAt: Date.now() } : p))
      saveProjects(next)
      set({ projects: next })
    },
  }
})
