import React from 'react'
import { Settings, Save } from 'lucide-react'

interface ExportTabProps {
  isLoading: boolean
  onExport: () => void
}

export default function ExportTab({ isLoading, onExport }: ExportTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">Export Settings</label>
        <div className="bg-(--card-bg) border border-(--overlay-border) rounded-xl p-3.5 space-y-2 text-xs text-(--text-secondary)">
          <div className="flex justify-between">
            <span className="font-medium text-(--text-muted)">Output FPS</span>
            <span className="font-semibold text-(--text-primary) tabular-nums">12</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-(--text-muted)">Max Size</span>
            <span className="font-semibold text-(--text-primary) tabular-nums">512px</span>
          </div>
        </div>
      </div>

      <button
        className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer bg-linear-to-r from-[#10B981] to-[#3B82F6] hover:opacity-90 shadow-lg shadow-[#10B981]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
        onClick={onExport}
      >
        {isLoading ? (
          <Settings className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {isLoading ? 'Processing...' : 'Generate GIF'}
      </button>
    </div>
  )
}
