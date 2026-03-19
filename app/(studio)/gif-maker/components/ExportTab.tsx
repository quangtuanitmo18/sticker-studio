import React from 'react'
import { Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportTabProps {
  isLoading: boolean
  onExport: () => void
}

export default function ExportTab({ isLoading, onExport }: ExportTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Settings</label>
        <div className="text-xs text-[var(--text-secondary)] space-y-2 bg-[var(--card-bg)] p-3 rounded-md border border-[var(--overlay-border)]">
           <div className="flex justify-between font-medium"><span>Output FPS</span><span className="tabular-nums">12</span></div>
           <div className="flex justify-between font-medium"><span>Max Size</span><span className="tabular-nums">512px</span></div>
        </div>
      </div>
      <Button 
        className="w-full gap-2 bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-white font-medium py-6 transition" 
        size="lg"
        disabled={isLoading}
        onClick={onExport}
      >
        {isLoading ? (
          <Settings className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {isLoading ? 'Processing...' : 'Generate GIF'}
      </Button>
    </div>
  )
}
