import React, { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { useProjectsStore } from '@/lib/projects'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function Sidebar() {
  const { dict } = useI18n()
  const { projects, activeId, setActive, createProject, renameProject, deleteProject } = useProjectsStore()

  const [renameId, setRenameId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const active = useMemo(() => projects.find(p => p.id === activeId) || projects[0], [projects, activeId])

  function openRename(id: string) {
    const p = projects.find(x => x.id === id)
    setRenameId(id)
    setName(p?.name || '')
  }

  function saveRename() {
    if (!renameId) return
    renameProject(renameId, name.trim() || 'Untitled')
    setRenameId(null)
  }

  return (
    <aside className="w-[280px] shrink-0 border-r border-white/10 glass">
      <div className="p-4 flex items-center justify-between">
        <div className="text-sm font-semibold">{dict.sidebar.projects}</div>
        <Button size="sm" onClick={createProject}>+ {dict.sidebar.newProject}</Button>
      </div>

      <div className="px-3 pb-3">
        <div className="glass rounded-2xl p-2">
          <div className="text-[11px] text-white/60 px-2 py-1">{dict.sidebar.notSynced}</div>
        </div>
      </div>

      <div className="px-2 pb-4 overflow-auto h-[calc(100vh-112px)]">
        <div className="space-y-1">
          {projects.map((p) => {
            const isActive = p.id === active.id
            return (
              <div
                key={p.id}
                className={
                  'rounded-2xl px-3 py-2 border transition cursor-pointer ' +
                  (isActive
                    ? 'bg-white/10 border-white/18'
                    : 'bg-transparent border-transparent hover:bg-white/6 hover:border-white/10')
                }
                onClick={() => setActive(p.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-white/55">{new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openRename(p.id) }}>
                      {dict.sidebar.rename}
                    </Button>
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); deleteProject(p.id) }}>
                      {dict.sidebar.delete}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={!!renameId} onClose={() => setRenameId(null)} title={dict.sidebar.rename}>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameId(null)}>{dict.common.cancel}</Button>
            <Button onClick={saveRename}>{dict.common.save}</Button>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
