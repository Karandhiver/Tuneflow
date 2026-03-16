'use client'
import { useState } from 'react'

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

interface Props {
  onSpeedChange: (speed: number) => void
  currentSpeed: number
}

export function SpeedControl({ onSpeedChange, currentSpeed }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-full bg-apple-surface2 text-xs font-bold text-white tabular-nums min-w-[52px] text-center"
      >
        {currentSpeed === 1 ? '1×' : `${currentSpeed}×`}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-20 glass rounded-2xl overflow-hidden shadow-2xl min-w-[100px]">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => { onSpeedChange(s); setOpen(false) }}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-colors ${
                  currentSpeed === s
                    ? 'text-apple-red font-bold'
                    : 'text-white hover:bg-apple-surface'
                }`}
              >
                <span>{s === 1 ? 'Normal' : `${s}×`}</span>
                {currentSpeed === s && <span className="text-apple-red text-xs">●</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
