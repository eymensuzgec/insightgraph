import React, { useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import type { AnalysisResult } from '@/engine/analyze'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Mode = 'draft' | 'fix' | 'summary' | 'outline' | 'thesis' | 'counter' | 'questions' | 'titles' | 'aiPrompt'

type AiStatus = 'idle' | 'loading' | 'error' | 'done'

function getLocal(key: string) {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}

function setLocal(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

function normalizeWhitespace(s: string) {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitLongSentencesTR(text: string) {
  // Naive readability pass: split very long sentences by common Turkish connectors
  return text
    .split(/(?<=[\.!?])\s+/)
    .map((sent) => {
      const words = sent.split(/\s+/).filter(Boolean)
      if (words.length <= 28) return sent
      return sent
        .replace(/\b(ama|fakat|lakin|ancak|oysa|halbuki|çünkü|dolayısıyla|bu yüzden)\b/gi, (m) => `\n${m}`)
    })
    .join(' ')
}

function paragraphize(text: string) {
  // Create paragraphs around \n and also after long blocks
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const paras: string[] = []
  let buf: string[] = []
  for (const l of lines) {
    buf.push(l)
    const wc = buf.join(' ').split(/\s+/).filter(Boolean).length
    if (wc >= 55) {
      paras.push(buf.join(' '))
      buf = []
    }
  }
  if (buf.length) paras.push(buf.join(' '))
  return paras.join('\n\n')
}

function improveTextLocal(text: string, lang: string) {
  const base = normalizeWhitespace(text)
  if (!base) {
    return {
      improved: '',
      notes: lang.startsWith('tr')
        ? ['Önce editöre bir metin yaz.']
        : ['Write something in the editor first.'],
    }
  }

  const tightened = lang.startsWith('tr') ? splitLongSentencesTR(base) : base
  const improved = paragraphize(tightened)

  const notes: string[] = []
  const wordCount = base.split(/\s+/).filter(Boolean).length
  if (wordCount > 220) notes.push(lang.startsWith('tr') ? 'Metin uzun: girişte ana iddiayı tek cümlede sabitleyip paragrafları tek fikre indir.' : 'Long text: anchor the main claim in one sentence and keep one idea per paragraph.')
  if (!/[\.!?]/.test(base)) notes.push(lang.startsWith('tr') ? 'Noktalama az: cümle sonlarını . ! ? ile belirginleştir.' : 'Low punctuation: add clear sentence endings (. ! ?).')
  if (/\b(şey|yani|hani)\b/gi.test(base)) notes.push(lang.startsWith('tr') ? 'Dolgu kelimeleri (şey/yani/hani) azaltmak metni güçlendirir.' : 'Reducing filler words can make the text stronger.')
  notes.push(lang.startsWith('tr') ? 'Öneri: Her paragrafın sonunda “bu yüzden/dolayısıyla” ile küçük bir çıkarım yaz.' : 'Tip: End each paragraph with a small takeaway (“therefore/so”).')

  return { improved, notes }
}

async function generateAiPrompt(opts: {
  apiKey: string
  topic: string
  language: string
  purpose: string
  length: string
  concepts: string[]
  signal?: AbortSignal
}) {
  // Optional BYOK mode (no backend). Runs only if user provided a key.
  const { apiKey, topic, language, purpose, length, concepts, signal } = opts
  const sys = `You are an expert prompt engineer. Create a single high-quality prompt for an AI assistant. The prompt must be clear, structured, and include constraints, format, and evaluation criteria. Output only the final prompt.`
  const user = `Topic: ${topic}\nLanguage of output: ${language}\nPurpose: ${purpose}\nDesired length: ${length}\nKey concepts to include: ${concepts.slice(0, 10).join(', ') || 'N/A'}\n\nMake it practical and premium (startup-grade).`
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    }),
    signal,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`AI request failed (${res.status}). ${txt}`)
  }
  const json: any = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') throw new Error('AI response empty.')
  return content.trim()
}

function pick<T>(arr: T[], n: number) {
  return arr.slice(0, Math.max(0, n))
}

function sentenceJoin(parts: string[]) {
  return parts.filter(Boolean).join(' ')
}

function buildTitleCandidates(topic: string, concepts: string[]) {
  const c = concepts.slice(0, 4)
  return [
    `${topic}: ${c[0] ?? 'Kavramlar'} Üzerinden Bir İnceleme`,
    `${topic} — ${c[0] ?? 'Odak'} ve ${c[1] ?? 'Bağlam'} Perspektifi`,
    `${topic} Hakkında Net Bir Çerçeve: ${c.join(', ')}`,
    `${topic}: Sorun, Yaklaşım ve Sonuç`,
    `${topic}: Temel İddialar ve Karşı Görüşler`,
  ].filter(Boolean)
}

function buildSummary(topic: string, concepts: string[], quality?: AnalysisResult['quality']) {
  const cs = pick(concepts, 6)
  const q = quality
  const score = q ? Math.round((q.clarity + q.readability + q.structure + q.argument) / 4) : null

  return [
    `## Yönetici Özeti`,
    ``,
    `**Konu:** ${topic}`,
    score !== null ? `**Genel skor:** ${score}/100` : '',
    ``,
    `Bu metin; ${cs.join(', ')} kavramları etrafında şekilleniyor. Amaç; ana iddiayı netleştirmek, gerekçeleri sıralamak ve olası itirazlara cevap vermek.`,
    ``,
    `**Ana kavramlar:** ${cs.join(' · ')}`,
    ``,
    `**Öneri:** Girişte ana iddiayı tek cümlede sabitleyip, her paragrafta *tek bir kavramı* işle. Sonuç bölümünde “bu yüzden / dolayısıyla” ile net bir çıkarım yaz.`,
  ].filter(Boolean).join('\n')
}

function buildOutline(topic: string, concepts: string[]) {
  const cs = pick(concepts, 8)
  return [
    `## Taslak Plan`,
    ``,
    `### 1) Giriş`,
    `- ${topic} nedir? Neden önemli?`,
    `- Ana iddia (1 cümle)`,
    ``,
    `### 2) Temel Çerçeve`,
    `- Kavramlar: ${cs.slice(0, 4).join(', ')}`,
    `- Tanımlar ve sınırlar`,
    ``,
    `### 3) Argüman Omurgası`,
    ...cs.slice(0, 5).map((c, i) => `- Argüman ${i + 1}: ${c} → gerekçe → örnek → çıkarım`),
    ``,
    `### 4) Karşı Görüşler`,
    `- En güçlü itiraz`,
    `- Adil sunum + cevap`,
    ``,
    `### 5) Sonuç`,
    `- Kısa özet`,
    `- “Dolayısıyla …” ile net çıkarım`,
    `- İleriye dönük öneri / risk`,
  ].join('\n')
}

function buildThesis(topic: string, concepts: string[]) {
  const c = pick(concepts, 5)
  return [
    `## Tez + Destekleyici İddialar`,
    ``,
    `**Tez:** ${topic}, ${c.slice(0, 3).join(', ')} ekseninde değerlendirildiğinde daha tutarlı ve uygulanabilir bir çerçeve sunar.`,
    ``,
    `**Destekleyici iddialar:**`,
    ...c.map((x, i) => `${i + 1}. **${x}**: Bu kavram üzerinden ölçülebilir bir gerekçe kur ve kısa bir örnek ekle.`),
    ``,
    `**Kısa sonuç:** Bu iddiaları “çünkü / bu yüzden / dolayısıyla” bağlantılarıyla zincirle.`,
  ].join('\n')
}

function buildCounter(topic: string, concepts: string[]) {
  const c = pick(concepts, 6)
  return [
    `## Karşı Argüman Paketi`,
    ``,
    `**Adil itiraz:** "${topic}" yaklaşımının zayıf tarafı, ${c.slice(0, 2).join(' ve ')} gibi noktaları yeterince hesaba katmamasıdır.`,
    ``,
    `**3 güçlü itiraz + cevap:**`,
    `1) İtiraz: … (${c[0] ?? 'kavram'})`,
    `   Cevap: İtirazın haklı kısmını kabul et, kapsamı daralt ve çözüm öner.`,
    `2) İtiraz: … (${c[1] ?? 'kavram'})`,
    `   Cevap: Alternatif açıklamayı sun ve hangi koşulda geçerli olduğunu belirt.`,
    `3) İtiraz: … (${c[2] ?? 'kavram'})`,
    `   Cevap: Veri/örnek/ilke ekleyerek güçlendir.`,
    ``,
    `**Not:** Karşı görüşü çürütmek yerine “daha iyi bir çerçeve” önermeye odaklan.`,
  ].join('\n')
}

function buildQuestions(topic: string, concepts: string[]) {
  const c = pick(concepts, 8)
  const q = [
    `## Soru Seti (Tartışma / Araştırma)`,
    ``,
    `1) ${topic} için en kritik varsayım nedir?`,
    `2) ${topic} hangi koşullarda başarısız olur?`,
    `3) ${c[0] ?? 'Kavram'} ile ${c[1] ?? 'kavram'} arasında nedensel ilişki var mı?`,
    `4) En güçlü karşı görüş ne ve neden?`,
    `5) Bu konuda ölçülebilir bir başarı metriği nasıl tanımlanır?`,
    `6) ${c[2] ?? 'Kavram'} açısından etik/risk boyutu nedir?`,
    `7) “Dolayısıyla” diyebilmek için hangi veri/örnek gerekir?`,
    `8) Sonuç bölümünde hangi tek cümle kalıcı olmalı?`,
  ]
  return q.join('\n')
}

function buildDraft(topic: string, concepts: string[], lang: string) {
  const c = pick(concepts, 8)
  const intro = sentenceJoin([
    `${topic} konusu,`,
    `${c.slice(0, 3).join(', ')} gibi kavramlarla birlikte düşünülmediğinde`,
    `dağınık ve ikna gücü düşük bir metne dönüşebilir.`,
  ])

  const body1 = sentenceJoin([
    `Öncelikle`,
    `${c[0] ?? 'ana kavram'} kavramını netleştirmek gerekir:`,
    `tanım, kapsam ve sınır.`,
    `Bu netlik, sonraki argümanların “çünkü” bağlantısını sağlamlaştırır.`,
  ])

  const body2 = sentenceJoin([
    `İkinci olarak`,
    `${c[1] ?? 'ikincil kavram'} üzerinden`,
    `somut bir gerekçe kur:`,
    `örnek, karşılaştırma veya kısa bir mini-vaka.`,
    `Ardından “bu yüzden” ile çıkarımı tek cümlede bağla.`,
  ])

  const body3 = sentenceJoin([
    `Metnin ikna gücü,`,
    `en güçlü karşı görüşü adil şekilde sunup`,
    `mantıklı bir cevapla dengelemesine bağlıdır.`,
    `Burada ${c[2] ?? 'kavram'} ve ${c[3] ?? 'kavram'} arasındaki ilişkiyi açıkça yaz.`,
  ])

  const conclusion = sentenceJoin([
    `Sonuç olarak`,
    `${topic} hakkında güçlü bir metin,`,
    `kavramları sıraya koyan,`,
    `gerekçeyi örnekle destekleyen ve`,
    `“dolayısıyla” ile net bir çıkarım üreten metindir.`,
  ])

  const heading = lang === 'tr' ? '## Taslak Metin' : '## Draft'
  return [
    heading,
    ``,
    intro,
    ``,
    `**1) Kavramları sabitle:** ${c.slice(0, 4).join(' · ')}`,
    ``,
    body1,
    ``,
    body2,
    ``,
    body3,
    ``,
    `**Kısa karşı görüş:** “${topic} yaklaşımı şu noktada eksik…” → cevap: “Bunu şu koşulla sınırlarsak…”`,
    ``,
    conclusion,
  ].join('\n')
}

export function TextStudioModal({
  result,
  currentText,
  onInsert,
}: {
  result: AnalysisResult | null
  currentText: string
  onInsert: (text: string) => void
}) {
  const { dict, lang } = useI18n()
  const [mode, setMode] = useState<Mode>('draft')
  const [topic, setTopic] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [aiKey, setAiKey] = useState(() => getLocal('ig_ai_key'))
  const [aiPurpose, setAiPurpose] = useState('Genel yazım / analiz')
  const [aiLength, setAiLength] = useState('Orta')
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle')
  const [aiError, setAiError] = useState('')
  const [aiPromptOut, setAiPromptOut] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const concepts = useMemo(() => {
    const fromResult = result?.keywords?.slice(0, 10).map(k => k.term) ?? []
    if (fromResult.length) return fromResult
    const rough = currentText
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
    return Array.from(new Set(rough)).slice(0, 12)
  }, [result, currentText])

  const computedTopic = topic.trim() || (concepts[0] ? concepts[0] : (lang.startsWith('tr') ? 'Konunuz' : 'Your topic'))

  const fixer = useMemo(() => improveTextLocal(currentText, lang), [currentText, lang])

  const deterministicPrompt = useMemo(() => {
    const cs = concepts.slice(0, 10)
    const outLang = lang.startsWith('tr') ? 'Türkçe' : 'English'
    return [
      `Sen deneyimli bir asistanısın. Aşağıdaki konu hakkında ${aiLength.toLowerCase()} uzunlukta, net ve yapılandırılmış bir çıktı üret.`,
      `\n**Konu:** ${computedTopic}`,
      `\n**Amaç:** ${aiPurpose}`,
      `\n**Dahil edilecek kavramlar:** ${cs.join(', ') || '—'}`,
      `\n**Dil:** ${outLang}`,
      `\n**Format:**`,
      `- Başlık`,
      `- 3-5 madde ana fikir`,
      `- 2 paragraf açıklama`,
      `- Sonuçta tek cümle çıkarım ("dolayısıyla" ile)`,
      `\n**Kalite kuralları:**`,
      `- Tekrar yok`,
      `- Her paragrafta tek fikir`,
      `- Somut örnek veya mini-vaka ekle`,
    ].join('\n')
  }, [concepts, computedTopic, aiLength, aiPurpose, lang])

  const output = useMemo(() => {
    switch (mode) {
      case 'fix':
        return [
          lang.startsWith('tr') ? '## Metin Düzeltme (Yerel)' : '## Text Fix (Local)',
          '',
          fixer.improved || (lang.startsWith('tr') ? '_Editörde metin yok._' : '_No text in the editor._'),
          '',
          lang.startsWith('tr') ? '### Öneriler' : '### Suggestions',
          ...fixer.notes.map((n) => `- ${n}`),
        ].join('\n')
      case 'summary': return buildSummary(computedTopic, concepts, result?.quality)
      case 'outline': return buildOutline(computedTopic, concepts)
      case 'draft': return buildDraft(computedTopic, concepts, lang)
      case 'thesis': return buildThesis(computedTopic, concepts)
      case 'counter': return buildCounter(computedTopic, concepts)
      case 'questions': return buildQuestions(computedTopic, concepts)
      case 'titles': return buildTitleCandidates(computedTopic, concepts).map((t, i) => `${i + 1}. ${t}`).join('\n')
      case 'aiPrompt':
        return [
          lang.startsWith('tr') ? '## AI Prompt Oluşturucu' : '## AI Prompt Builder',
          '',
          aiPromptOut || deterministicPrompt,
          '',
          lang.startsWith('tr')
            ? '_Not: API anahtarı eklemeden bu ekran yerel şablon üretir. AI ile güçlendirmek için “AI Ayarları”ndan anahtar ekleyebilirsin._'
            : '_Note: Without an API key, this uses local templates. Add a key in “AI Settings” to enhance._',
        ].join('\n')
      default: return buildDraft(computedTopic, concepts, lang)
    }
  }, [mode, computedTopic, concepts, lang, result?.quality, fixer, aiPromptOut, deterministicPrompt])

  async function runAiPrompt() {
    setAiError('')
    setAiStatus('loading')
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    try {
      if (!aiKey.trim()) {
        setAiPromptOut('')
        setAiStatus('done')
        return
      }
      const outLang = lang.startsWith('tr') ? 'Turkish' : 'English'
      const prompt = await generateAiPrompt({
        apiKey: aiKey.trim(),
        topic: computedTopic,
        language: outLang,
        purpose: aiPurpose,
        length: aiLength,
        concepts,
        signal: ac.signal,
      })
      setAiPromptOut(prompt)
      setAiStatus('done')
    } catch (e: any) {
      setAiStatus('error')
      setAiError(e?.message || 'AI error')
    }
  }

  function saveAiKey(next: string) {
    setAiKey(next)
    setLocal('ig_ai_key', next)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/70">
        {dict.editor.studio}: Yerel yazım araçları + (opsiyonel) AI prompt oluşturucu. Çıktıyı düzenleyip editöre ekleyebilirsin.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-white/60 mb-1">Konu</div>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Opsiyonel: konu başlığı yaz" />

          <div className="mt-4 text-xs text-white/60 mb-2">Mod</div>
          <Tabs
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            items={[
              { value: 'draft', label: 'Taslak' },
              { value: 'fix', label: 'Düzelt' },
              { value: 'summary', label: 'Özet' },
              { value: 'outline', label: 'Plan' },
              { value: 'thesis', label: 'Tez' },
              { value: 'counter', label: 'Karşı' },
              { value: 'questions', label: 'Sorular' },
              { value: 'titles', label: 'Başlıklar' },
              { value: 'aiPrompt', label: 'AI Prompt' },
            ]}
          />

          {mode === 'aiPrompt' && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <div className="text-xs text-white/60">Amaç</div>
                <Input value={aiPurpose} onChange={(e) => setAiPurpose(e.target.value)} placeholder="Örn: Makale, sunum, ikna yazısı..." />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="text-xs text-white/60">Uzunluk</div>
                <Input value={aiLength} onChange={(e) => setAiLength(e.target.value)} placeholder="Kısa / Orta / Uzun" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="ghost" onClick={() => setAiOpen(v => !v)}>
                  AI Ayarları
                </Button>
                <Button size="sm" onClick={runAiPrompt} disabled={aiStatus === 'loading'}>
                  {aiStatus === 'loading' ? 'Üretiliyor…' : (aiKey.trim() ? 'AI ile üret' : 'Şablon üret')}
                </Button>
              </div>

              {aiOpen && (
                <div className="glass rounded-2xl p-3 space-y-2">
                  <div className="text-xs text-white/70">OpenAI API Key (yerel saklanır). Key girmeden de şablon üretir.</div>
                  <Input value={aiKey} onChange={(e) => saveAiKey(e.target.value)} placeholder="sk-..." />
                  <div className="text-[11px] text-white/60">
                    Not: API key sadece sen “AI ile üret” dediğinde OpenAI’ye istek atmak için kullanılır.
                  </div>
                </div>
              )}

              {aiStatus === 'error' && (
                <div className="text-xs text-red-300">{aiError}</div>
              )}
            </div>
          )}

          <div className="mt-4 text-xs text-white/60">Kullanılan kavramlar</div>
          <div className="mt-2 text-xs text-white/80 break-words">{concepts.slice(0, 10).join(', ') || '—'}</div>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">Çıktı (Markdown)</div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(output)}>Kopyala</Button>
              <Button size="sm" onClick={() => onInsert(output)}>Editöre ekle</Button>
            </div>
          </div>

          <textarea
            value={output}
            readOnly
            className="mt-3 h-[320px] w-full resize-none rounded-2xl bg-white/4 border border-white/10 p-3 text-xs leading-5"
          />

          <div className="mt-3 text-xs text-white/55">
            İpucu: Analiz yaptıktan sonra çıktı daha isabetli olur (kavramlar + kalite skorlarıyla beslenir).
          </div>
        </div>
      </div>
    </div>
  )
}
