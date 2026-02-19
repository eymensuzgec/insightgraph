import React, { useEffect, useMemo, useRef, useState } from 'react'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'

import type { CooccurrenceEdge } from '@/engine/analyze'
import { Button } from '@/components/ui/Button'

type Node = {
  id: string
  degree: number
  x?: number
  y?: number
  vx?: number
  vy?: number
}

type Props = {
  edges: CooccurrenceEdge[]
}

export function GraphView({ edges }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const gRef = useRef<SVGGElement | null>(null)
  const zoomRef = useRef<any>(null)

  const { nodes, links } = useMemo(() => {
    const deg = new Map<string, number>()
    for (const e of edges) {
      deg.set(e.source, (deg.get(e.source) || 0) + e.weight)
      deg.set(e.target, (deg.get(e.target) || 0) + e.weight)
    }
    const nodes: Node[] = Array.from(deg.entries())
      .map(([id, d]) => ({ id, degree: d }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 40)

    const nodeSet = new Set(nodes.map(n => n.id))
    const links = edges
      .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      .slice(0, 80)
      .map(e => ({ ...e }))

    return { nodes, links }
  }, [edges])

  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    const g = gRef.current
    if (!svg || !g) return

    // IMPORTANT: d3-zoom behavior expects a *d3 selection*.
    // Passing a raw DOM element will crash inside d3 with: selection.property is not a function.
    const svgSel = select(svg)

    const w = svg.clientWidth || 700
    const h = svg.clientHeight || 520

    // Zoom
    const z = zoomRef.current || zoom<SVGSVGElement, unknown>().on('zoom', (ev) => {
      g.setAttribute('transform', ev.transform.toString())
    })
    zoomRef.current = z

    // Apply zoom to selection (NOT raw element)
    // @ts-expect-error d3 zoom typing
    svgSel.call(z as any)
    // @ts-expect-error d3 zoom typing
    svgSel.call((z as any).transform, zoomIdentity)

    // Simulation
    const sim = forceSimulation<Node>(nodes)
      .force('charge', forceManyBody().strength(-240))
      .force('center', forceCenter(w / 2, h / 2))
      .force('collide', forceCollide<Node>().radius((d) => 10 + Math.sqrt(d.degree) * 0.9))
      // @ts-expect-error d3-force Link generics
      .force('link', forceLink(links as any).id((d: any) => d.id).distance((l: any) => 80 - Math.min(40, l.weight * 6)).strength(0.22))

    const linkEls = Array.from(g.querySelectorAll<SVGLineElement>('line[data-link]'))
    const nodeEls = Array.from(g.querySelectorAll<SVGCircleElement>('circle[data-node]'))
    const labelEls = Array.from(g.querySelectorAll<SVGTextElement>('text[data-label]'))

    sim.on('tick', () => {
      try {
        for (let i = 0; i < links.length; i++) {
          const e: any = links[i]
          const line = linkEls[i]
          if (!line) continue
          const s = e.source
          const t = e.target
          // d3-force mutates source/target into node objects; guard against transient string state
          if (!s || !t || typeof s === 'string' || typeof t === 'string') continue
          if (!Number.isFinite(s.x) || !Number.isFinite(s.y) || !Number.isFinite(t.x) || !Number.isFinite(t.y)) continue
          line.setAttribute('x1', String(s.x))
          line.setAttribute('y1', String(s.y))
          line.setAttribute('x2', String(t.x))
          line.setAttribute('y2', String(t.y))
        }
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          const c = nodeEls[i]
          const t = labelEls[i]
          if (c && Number.isFinite(n.x) && Number.isFinite(n.y)) {
            c.setAttribute('cx', String(n.x))
            c.setAttribute('cy', String(n.y))
          }
          if (t) {
            t.setAttribute('x', String((n.x || 0) + 12))
            t.setAttribute('y', String((n.y || 0) + 4))
          }
        }
      } catch {
        // swallow to avoid white-screen; ErrorBoundary will catch render errors, not tick loop errors
      }
    })

    return () => {
      sim.stop()
    }
  }, [nodes, links])

  function resetView() {
    const svg = svgRef.current
    if (!svg) return
    const z = zoomRef.current
    if (!z) return
    // @ts-expect-error
    z.transform(svg, zoomIdentity)
  }

  async function exportPng() {
    const svg = svgRef.current
    const g = gRef.current
    if (!svg || !g) return

    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.querySelectorAll('button').forEach(b => b.remove())

    const xml = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = svg.clientWidth * 2
      canvas.height = svg.clientHeight * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#07070b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.download = 'insightgraph.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = url
  }

  if (!edges.length) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-white/70">
        No graph data yet.
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-sm text-white/80">Concept Graph</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={resetView}>Reset</Button>
          <Button size="sm" variant="ghost" onClick={exportPng}>Export PNG</Button>
        </div>
      </div>

      <div className="relative h-[520px]">
        <svg ref={svgRef} className="h-full w-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g ref={gRef}>
            {links.map((e, i) => (
              <line
                key={`${e.source}-${e.target}-${i}`}
                data-link
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={Math.max(1, Math.min(3, e.weight))}
              />
            ))}

            {nodes.map((n) => {
              const isSel = selected === n.id
              return (
                <g key={n.id}>
                  <circle
                    data-node
                    r={10 + Math.sqrt(n.degree) * 0.9}
                    fill={isSel ? 'rgba(99,102,241,0.95)' : 'rgba(255,255,255,0.24)'}
                    stroke={isSel ? 'rgba(99,102,241,1)' : 'rgba(255,255,255,0.22)'}
                    strokeWidth={1}
                    filter={isSel ? 'url(#glow)' : undefined}
                    onClick={() => setSelected(n.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <text data-label fontSize="12" fill="rgba(255,255,255,0.75)">{n.id}</text>
                </g>
              )
            })}
          </g>
        </svg>

        {selected && (
          <div className="absolute right-3 top-3 w-[260px] glass-strong rounded-2xl p-3">
            <div className="text-sm font-medium">{selected}</div>
            <div className="mt-1 text-xs text-white/70">Click other nodes to inspect.</div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
