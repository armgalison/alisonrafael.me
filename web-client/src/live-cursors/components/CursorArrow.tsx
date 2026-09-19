import type { CursorState } from '../types'

// Percentages resolve against the fixed inset-0 parent LiveCursorOverlay
// renders this in, i.e. the viewer's own viewport — each receiving client
// rescales the sender's normalized position to its own screen.
export function CursorArrow({ color, xPct, yPct }: CursorState) {
  return (
    <div
      className="absolute -translate-x-[2px] -translate-y-[2px] transition-[left,top] duration-75 ease-linear"
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 2L18 8.5L10.5 10.5L8.5 18L2 2Z"
          fill={color}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
