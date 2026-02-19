import React from 'react'
import { Button } from '@/components/ui/Button'

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }

  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error('UI crash:', err)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-xl">
            <div className="text-lg font-semibold">InsightGraph crashed</div>
            <div className="mt-2 text-sm text-white/70">{this.state.message || 'Unknown error'}</div>
            <div className="mt-5 flex gap-2">
              <Button onClick={() => location.reload()}>Reload</Button>
              <Button variant="ghost" onClick={() => this.setState({ hasError: false })}>Try continue</Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
