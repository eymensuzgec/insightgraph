import React, { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import type { AnalysisResult } from '@/engine/analyze'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GraphView } from '@/graph/GraphView'

export function ResultsPanel({ result }: { result: AnalysisResult | null }) {
  const { dict } = useI18n()
  const [tab, setTab] = useState<'summary' | 'keywords' | 'graph' | 'report' | 'insights'>('summary')

  const tabs = useMemo(() => ([
    { value: 'summary', label: dict.results.tabs.summary },
    { value: 'keywords', label: dict.results.tabs.keywords },
    { value: 'graph', label: dict.results.tabs.graph },
    { value: 'report', label: dict.results.tabs.report },
    { value: 'insights', label: dict.results.tabs.insights },
  ]), [dict])

  function exportJson() {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = 'insightgraph.json'
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportCsv() {
    if (!result) return
    const rows = [['term', 'count', 'score'], ...result.keywords.map(k => [k.term, String(k.count), String(Math.round(k.score * 100) / 100)])]
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = 'insightgraph-keywords.csv'
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  function printReport() {
    if (!result) return
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>InsightGraph Report</title>
    <style>body{font-family:system-ui,Segoe UI,Arial;margin:32px;}h1{margin:0 0 8px;}h2{margin:24px 0 8px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ddd;padding:8px;font-size:12px;}th{text-align:left;background:#f5f5f7;}</style></head><body>
    <h1>InsightGraph Report</h1>
    <div style="color:#666;font-size:12px">Generated locally in your browser • No external AI</div>
    <h2>Summary</h2>
    <ul>
      <li><b>Words:</b> ${result.wordCount}</li>
      <li><b>Unique concepts:</b> ${result.uniqueCount}</li>
      <li><b>Top concepts:</b> ${result.summary.topConcepts.join(', ')}</li>
    </ul>
    <h2>Scores</h2>
    <ul>
      <li><b>Clarity:</b> ${result.quality.clarity.toFixed(0)}</li>
      <li><b>Readability:</b> ${result.quality.readability.toFixed(0)}</li>
      <li><b>Structure:</b> ${result.quality.structure.toFixed(0)}</li>
      <li><b>Argument:</b> ${result.quality.argument.toFixed(0)}</li>
    </ul>
    <h2>Keywords</h2>
    <table><thead><tr><th>Term</th><th>Count</th><th>Score</th></tr></thead><tbody>
      ${result.keywords.map(k => `<tr><td>${escapeHtml(k.term)}</td><td>${k.count}</td><td>${k.score.toFixed(2)}</td></tr>`).join('')}
    </tbody></table>
    <h2>Insights</h2>
    <ul>${result.insights.map(i => `<li><b>${escapeHtml(i.label)}:</b> ${escapeHtml(i.detail)}</li>`).join('')}</ul>
    <script>window.onload=()=>window.print();</script>
    </body></html>`

    const w = window.open('', '_blank')
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  return (
    <aside className="w-[420px] shrink-0 pr-4 py-4">
      <div className="glass rounded-2xl border border-white/10 h-[calc(100vh-88px)] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <Tabs value={tab} onChange={(v) => setTab(v as any)} items={tabs} />
        </div>

        <div className="p-4 overflow-auto flex-1">
          {!result ? (
            <div className="text-sm text-white/60">{dict.results.empty}</div>
          ) : tab === 'summary' ? (
            <SummaryView result={result} onJson={exportJson} onCsv={exportCsv} />
          ) : tab === 'keywords' ? (
            <KeywordsView result={result} onCsv={exportCsv} />
          ) : tab === 'graph' ? (
            <GraphView edges={result.edges} />
          ) : tab === 'report' ? (
            <ReportView result={result} onPrint={printReport} />
          ) : (
            <InsightsView result={result} />
          )}
        </div>
      </div>
    </aside>
  )
}

function SummaryView({ result, onJson, onCsv }: { result: AnalysisResult; onJson: () => void; onCsv: () => void }) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="text-sm font-semibold">Overview</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Stat label="Words" value={String(result.wordCount)} />
          <Stat label="Unique" value={String(result.uniqueCount)} />
          <Stat label="Density" value={`${result.summary.density.toFixed(1)}%`} />
        </div>
        <div className="mt-3 text-xs text-white/70">Top concepts: <b className="text-white">{result.summary.topConcepts.join(', ')}</b></div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-sm font-semibold">Quality scores</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Score label="Clarity" v={result.quality.clarity} />
          <Score label="Readability" v={result.quality.readability} />
          <Score label="Structure" v={result.quality.structure} />
          <Score label="Argument" v={result.quality.argument} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onJson}>Export JSON</Button>
        <Button size="sm" variant="ghost" onClick={onCsv}>Export CSV</Button>
      </div>
    </div>
  )
}

function KeywordsView({ result, onCsv }: { result: AnalysisResult; onCsv: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Keywords</div>
        <Button size="sm" variant="ghost" onClick={onCsv}>CSV</Button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {result.keywords.map((k) => (
          <div key={k.term} className="glass rounded-2xl p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{k.term}</div>
              <div className="text-xs text-white/60">score: {k.score.toFixed(2)}</div>
            </div>
            <Badge>{k.count}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportView({ result, onPrint }: { result: AnalysisResult; onPrint: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Printable report</div>
      <div className="text-xs text-white/70">Opens a PDF-ready print view in a new tab.</div>
      <Button onClick={onPrint}>Print / Save as PDF</Button>

      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-white/70">Preview</div>
        <div className="mt-2 text-sm">Top concepts: {result.summary.topConcepts.join(', ')}</div>
      </div>
    </div>
  )
}

function InsightsView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-2">
      {result.insights.map((i) => (
        <div key={i.label} className="glass rounded-2xl p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{i.label}</div>
            <Badge tone={i.level === 'good' ? 'good' : i.level === 'warn' ? 'warn' : 'neutral'}>
              {i.level}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-white/70">{i.detail}</div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/6 border border-white/10 p-3">
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </div>
  )
}

function Score({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl bg-white/6 border border-white/10 p-3">
      <div className="text-[11px] text-white/60">{label}</div>
      <div className="text-sm font-semibold mt-1">{v.toFixed(0)}</div>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
