import React, { useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { useProjectsStore } from '@/lib/projects'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'

function countWords(text: string) {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

export function EditorPanel({
  isAnalyzing,
  progress,
  onAnalyze,
}: {
  isAnalyzing: boolean
  progress: { p: number; stage: string }
  onAnalyze: (text: string) => void
}) {
  const { dict } = useI18n()
  const { projects, activeId, updateText } = useProjectsStore()
  const active = projects.find(p => p.id === activeId) || projects[0]

  const [focus, setFocus] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const wordCount = useMemo(() => countWords(active.text), [active.text])

  function loadDemoTR() {
    updateText(active.id,
      'Bu metin, gizlilik-öncelikli bir kavram analiz sisteminin demo içeriğidir.\n\nAmaç: Anahtar kavramları, yoğunluğu, birlikte-oluş ilişkilerini ve mantıksal netlik sinyallerini yerel olarak çıkarmak.\n\nÇünkü veri cihazdan çıkmamalıdır; bu yüzden tüm analiz tarayıcı içinde yapılır. Dolayısıyla kullanıcı güveni, ürünün merkezinde olmalıdır.\n\nAncak netlik için daha kısa cümleler ve daha açık bir argüman yapısı gerekir. Örneğin: tez, gerekçe ve sonuç ayrı paragrafta sunulmalıdır.'
    )
  }

  function loadDemoEN() {
    updateText(active.id,
      'This text is a demo for a privacy-first concept analysis system.\n\nGoal: extract key concepts, density, co-occurrence relationships, and logical clarity signals locally in the browser.\n\nBecause data should not leave the device, all analysis runs client-side. Therefore trust and speed become core product pillars.\n\nHowever, clarity improves with shorter sentences and explicit reasoning. For example: keep thesis, evidence, and conclusion in separate paragraphs.'
    )
  }

  async function importTxt(file: File) {
    const text = await file.text()
    updateText(active.id, text)
  }

  return (
    <section className={
      'flex-1 min-w-0 flex flex-col ' +
      (focus ? 'px-0' : 'px-4')
    }>
      <div className={
        'mt-4 glass rounded-2xl border border-white/10 overflow-hidden flex flex-col ' +
        (focus ? 'h-[calc(100vh-88px)]' : 'h-[calc(100vh-136px)]')
      }>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{active.name}</div>
            <div className="text-xs text-white/60">{dict.editor.autosaved}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-white/70">
              <span>{dict.editor.wordCount}: <b className="text-white">{wordCount}</b></span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void importTxt(f)
              }}
            />

            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
              {dict.editor.importTxt}
            </Button>

            <Button size="sm" variant="ghost" onClick={loadDemoTR}>{dict.onboarding.loadDemoTR}</Button>
            <Button size="sm" variant="ghost" onClick={loadDemoEN}>{dict.onboarding.loadDemoEN}</Button>

            <Button size="sm" variant="ghost" onClick={() => setFocus(v => !v)}>
              {focus ? dict.editor.exitFocus : dict.editor.focus}
            </Button>

            <Button size="sm" onClick={() => onAnalyze(active.text)} disabled={isAnalyzing || !active.text.trim()}>
              {isAnalyzing ? dict.editor.analyzing : dict.editor.analyze}
            </Button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between text-xs text-white/70 mb-2">
              <span>{dict.editor.analyzing}</span>
              <span>{progress.p}%</span>
            </div>
            <Progress value={progress.p} />
          </div>
        )}

        <div className="flex-1 p-4">
          <textarea
            value={active.text}
            onChange={(e) => updateText(active.id, e.target.value)}
            placeholder={dict.editor.placeholder}
            className="h-full w-full resize-none rounded-2xl bg-white/4 border border-white/10 p-4 text-sm leading-6 outline-none focus:border-white/20"
          />
        </div>
      </div>
    </section>
  )
}
