/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Circular SVG progress ring showing match percentage.
 *                 Color changes by score: cyan (high), yellow (mid), pink (low).
 *                 Animates on mount via strokeDashoffset transition.
 * DEPENDS ON: formatters.js (getMatchColor, scoreToPercent)
 * PROPS: score (0-1), size (default 56), strokeWidth (default 4)
 */
import { getMatchColor, scoreToPercent } from '../../utils/formatters'
import { memo, useEffect, useState } from 'react'

function MatchRing({ score = 0, size = 56, strokeWidth = 6 }) {
  const safeScore = Math.max(0, Math.min(1, Number(score) || 0))
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setAnimatedScore(safeScore))
    return () => window.cancelAnimationFrame(raf)
  }, [safeScore])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - animatedScore * circumference
  const color = getMatchColor(safeScore)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 450ms ease, stroke 450ms ease' }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold font-mono text-(--text-primary)">{scoreToPercent(safeScore)}</span>
    </div>
  )
}

export default memo(MatchRing)