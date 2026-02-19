export type Keyword = { term: string; count: number; score: number }
export type CooccurrenceEdge = { source: string; target: string; weight: number }

export type AnalysisResult = {
  lang: string
  wordCount: number
  uniqueCount: number
  keywords: Keyword[]
  edges: CooccurrenceEdge[]
  summary: {
    topConcepts: string[]
    density: number
  }
  quality: {
    clarity: number
    readability: number
    structure: number
    argument: number
  }
  insights: Array<{ label: string; detail: string; level: 'info' | 'good' | 'warn' }>
}

type ProgressFn = (p: number, stage: string) => void

const STOPWORDS: Record<string, Set<string>> = {
  en: new Set(['the','a','an','and','or','but','if','then','so','to','of','in','on','for','with','as','at','by','is','are','was','were','be','been','it','this','that','these','those','you','we','they','i','he','she','them','our','your']),
  tr: new Set(['ve','veya','ama','fakat','çünkü','için','ile','gibi','bir','bu','şu','o','de','da','mi','mı','mu','mü','ki','daha','çok','az','en','olan','olarak','ise','ya','hem','ben','sen','biz','siz','onlar']),
}

function normalizeLang(lang: string) {
  const l = (lang || 'en').toLowerCase()
  if (l.startsWith('tr')) return 'tr'
  return 'en'
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\r/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean)
}

function sentences(text: string): string[] {
  return text
    .replace(/\r/g, ' ')
    .split(/[.!?。？！]+/g)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n))
}

export async function runAnalysis(text: string, langRaw: string, onProgress?: ProgressFn): Promise<AnalysisResult> {
  const lang = normalizeLang(langRaw)
  const stop = STOPWORDS[lang] || STOPWORDS.en

  const report = (p: number, stage: string) => onProgress?.(p, stage)

  report(5, 'preprocess')
  await tick()

  const toksAll = tokenize(text)
  const toks = toksAll.filter(t => t.length >= 3 && !stop.has(t))

  const wordCount = toksAll.length
  const freq = new Map<string, number>()
  for (const t of toks) freq.set(t, (freq.get(t) || 0) + 1)

  report(30, 'concepts')
  await tick()

  // n-grams (simple): join adjacent tokens if both are important
  const ngrams = new Map<string, number>()
  for (let i = 0; i < toks.length - 1; i++) {
    const a = toks[i]
    const b = toks[i + 1]
    if (a.length <= 4 || b.length <= 4) continue
    const term = `${a} ${b}`
    ngrams.set(term, (ngrams.get(term) || 0) + 1)
  }

  // build keyword list
  const entries: Array<{ term: string; count: number; score: number }> = []
  const total = toks.length || 1

  for (const [term, count] of freq.entries()) {
    const density = count / total
    const score = count * (1 + Math.log10(1 + density * 100))
    entries.push({ term, count, score })
  }
  for (const [term, count] of ngrams.entries()) {
    if (count < 2) continue
    const score = count * 2.2
    entries.push({ term, count, score })
  }

  entries.sort((a, b) => b.score - a.score)
  const keywords = entries.slice(0, 24)

  report(55, 'relationships')
  await tick()

  // co-occurrence: sliding window over sentences
  const topTerms = new Set(keywords.slice(0, 14).map(k => k.term.split(' ')[0]))
  const edgeMap = new Map<string, number>()

  const sents = sentences(text)
  for (const s of sents) {
    const stoks = tokenize(s).filter(t => t.length >= 3 && !stop.has(t))
    const present = Array.from(new Set(stoks.filter(t => topTerms.has(t))))
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const a = present[i]
        const b = present[j]
        const key = a < b ? `${a}|${b}` : `${b}|${a}`
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1)
      }
    }
  }

  const edges = Array.from(edgeMap.entries())
    .map(([k, w]) => {
      const [a, b] = k.split('|')
      return { source: a, target: b, weight: w }
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 60)

  report(80, 'scoring')
  await tick()

  // quality scores (deterministic)
  const sentLens = sents.map(s => tokenize(s).length)
  const avgSent = sentLens.reduce((a, b) => a + b, 0) / Math.max(1, sentLens.length)
  const variance = sentLens.reduce((a, x) => a + Math.pow(x - avgSent, 2), 0) / Math.max(1, sentLens.length)

  const repetition = (() => {
    const top = keywords.slice(0, 6).reduce((a, k) => a + k.count, 0)
    return top / Math.max(1, toks.length)
  })()

  const clarity = clamp(92 - avgSent * 1.6 - repetition * 35)
  const readability = clamp(90 - Math.sqrt(variance) * 1.3)
  const structure = clamp(60 + Math.min(40, sents.length * 2.5))
  const argSignals = countSignals(text, lang)
  const argument = clamp(45 + argSignals * 8)

  const topConcepts = keywords.slice(0, 5).map(k => k.term)
  const density = Math.round((keywords[0]?.count || 0) / Math.max(1, toks.length) * 1000) / 10

  const insights = buildInsights({ clarity, readability, structure, argument, density, argSignals })

  report(100, 'done')

  return {
    lang,
    wordCount,
    uniqueCount: freq.size,
    keywords,
    edges,
    summary: { topConcepts, density },
    quality: { clarity, readability, structure, argument },
    insights,
  }
}

function countSignals(text: string, lang: string) {
  const lower = text.toLowerCase()
  const patterns = lang === 'tr'
    ? ['çünkü','bu yüzden','dolayısıyla','ancak','fakat','öyleyse','sonuç','netice','örneğin']
    : ['because','therefore','however','but','so that','thus','in conclusion','for example']

  let c = 0
  for (const p of patterns) if (lower.includes(p)) c++
  return c
}

function buildInsights({ clarity, readability, structure, argument, density, argSignals }:
  { clarity: number; readability: number; structure: number; argument: number; density: number; argSignals: number }) {
  const out: Array<{ label: string; detail: string; level: 'info' | 'good' | 'warn' }> = []

  out.push({
    label: 'Clarity',
    detail: clarity >= 75 ? 'Clear and easy to follow.' : clarity >= 55 ? 'Mostly clear, but can be tightened.' : 'Consider simplifying sentences and reducing repetition.',
    level: clarity >= 75 ? 'good' : clarity >= 55 ? 'info' : 'warn',
  })

  out.push({
    label: 'Argument signals',
    detail: argSignals >= 3 ? 'Strong connective flow (because/therefore/however…).'
      : argSignals >= 1 ? 'Some reasoning connectors detected.'
      : 'Few reasoning connectors; consider adding “because/therefore/however” style structure.',
    level: argSignals >= 3 ? 'good' : argSignals >= 1 ? 'info' : 'warn',
  })

  out.push({
    label: 'Concept density',
    detail: density >= 6 ? 'High focus — key concepts appear consistently.' : density >= 3 ? 'Balanced density.' : 'Low density — topic may be too broad or scattered.',
    level: density >= 6 ? 'good' : density >= 3 ? 'info' : 'warn',
  })

  out.push({
    label: 'Readability',
    detail: readability >= 70 ? 'Smooth reading flow.' : 'Consider shorter sentences and clearer paragraphing.',
    level: readability >= 70 ? 'good' : 'info',
  })

  out.push({
    label: 'Structure',
    detail: structure >= 70 ? 'Good length and segmentation.' : 'Add headings or break into paragraphs for structure.',
    level: structure >= 70 ? 'good' : 'info',
  })

  out.push({
    label: 'Argument score',
    detail: argument >= 70 ? 'Argumentation looks strong.' : argument >= 55 ? 'Argumentation is present but can be clearer.' : 'Argumentation signals are weak; add premises and conclusions.',
    level: argument >= 70 ? 'good' : argument >= 55 ? 'info' : 'warn',
  })

  return out
}

async function tick() {
  await new Promise<void>(r => setTimeout(() => r(), 70))
}
