import { useCallback, useRef, useState } from 'react'
import type { AnalysisResult } from '@/engine/analyze'
import { runAnalysis } from '@/engine/analyze'

export function useAnalysis(lang: string) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState<{ p: number; stage: string }>({ p: 0, stage: '' })
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const lastText = useRef('')

  const analyze = useCallback(async (text: string) => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    setProgress({ p: 5, stage: 'start' })
    lastText.current = text
    try {
      const r = await runAnalysis(text, lang, (p, stage) => setProgress({ p, stage }))
      setResult(r)
    } finally {
      setIsAnalyzing(false)
    }
  }, [lang, isAnalyzing])

  return { isAnalyzing, progress, result, analyze, lastText }
}
