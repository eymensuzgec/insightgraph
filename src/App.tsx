import React, { useEffect, useMemo, useState } from 'react'
import { I18nProvider, useI18n } from '@/i18n'
import { initTheme } from '@/services/theme'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { EditorPanel } from '@/components/layout/EditorPanel'
import { ResultsPanel } from '@/components/layout/ResultsPanel'
import { Modal } from '@/components/ui/Modal'
import { OnboardingModal } from '@/features/onboarding/OnboardingModal'
import { TextStudioModal } from '@/features/studio/TextStudioModal'
import { useProjectsStore } from '@/lib/projects'
import { useAnalysis } from '@/hooks/useAnalysis'

function Shell() {
  const { lang, dict } = useI18n()
  const { projects, activeId, updateText } = useProjectsStore()
  const active = projects.find(p => p.id === activeId) || projects[0]

  const { isAnalyzing, progress, result, analyze } = useAnalysis(lang)

  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [studioOpen, setStudioOpen] = useState(false)

  useEffect(() => {
    initTheme()
    const key = 'ig:onboardingDone'
    const done = localStorage.getItem(key)
    if (!done) setOnboardingOpen(true)
  }, [])

  function closeOnboarding() {
    localStorage.setItem('ig:onboardingDone', '1')
    setOnboardingOpen(false)
  }

  const footer = useMemo(() => `Made BY Eymen SÜZGEÇ — ${dict.app.name}`, [dict.app.name])

  return (
    <div className="h-full flex flex-col">
      <Navbar onOpenStudio={() => setStudioOpen(true)} />

      <main className="flex-1 min-h-0 flex">
        <Sidebar />

        <EditorPanel
          isAnalyzing={isAnalyzing}
          progress={progress}
          onAnalyze={(t) => analyze(t)}
        />

        <ResultsPanel result={result} />
      </main>

      <footer className="h-10 px-4 flex items-center justify-between text-xs text-white/55 border-t border-white/10 glass">
        <div>{footer}</div>
        <div className="hidden md:block">Client-side • No external AI</div>
      </footer>

      <Modal open={onboardingOpen} onClose={closeOnboarding} title={dict.onboarding.title} widthClass="w-[980px]">
        <OnboardingModal onClose={closeOnboarding} />
      </Modal>

      <Modal open={studioOpen} onClose={() => setStudioOpen(false)} title={dict.editor.studio} widthClass="w-[980px]">
        <TextStudioModal
          result={result}
          currentText={active.text}
          onInsert={(text) => {
            updateText(active.id, active.text ? `${active.text}\n\n${text}` : text)
            setStudioOpen(false)
          }}
        />
      </Modal>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ErrorBoundary>
        <Shell />
      </ErrorBoundary>
    </I18nProvider>
  )
}
