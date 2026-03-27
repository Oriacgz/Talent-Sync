/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Horizontal waterfall bar chart showing SHAP feature
 *                 contributions. Positive = yellow bar right. Negative = pink bar left.
 *                 Bars animate from 0 to final width on mount.
 *                 Shows final score at bottom.
 * DEPENDS ON: formatters.js (scoreToPercent, getMatchColor)
 * PROPS: shapValues (object), totalScore (float 0-1)
 */
import { getMatchColor, scoreToPercent } from '../../utils/formatters'
import { memo, useMemo } from 'react'

function SHAPChart({ shapValues = {}, totalScore = 0 }) {
  const entries = useMemo(
    () => Object.entries(shapValues || {}).sort((a, b) => Math.abs(Number(b[1]) || 0) - Math.abs(Number(a[1]) || 0)),
    [shapValues]
  )
  const maxAbs = useMemo(
    () => entries.reduce((max, [, value]) => Math.max(max, Math.abs(Number(value) || 0)), 0.001),
    [entries]
  )

  return (
    <div className="brutal-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">Match Reasoning</h3>
        <span className="font-mono text-xs text-ink/70">Factor Impact</span>
      </div>
      <p className="mb-3 text-xs text-ink/65">Longer bars have stronger influence on the final match score.</p>

      {entries.length === 0 ? (
        <p className="text-sm text-ink/70">No explainability data available yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([feature, value], index) => {
            const numeric = Number(value) || 0
            const width = `${Math.max(6, (Math.abs(numeric) / maxAbs) * 100)}%`
            const positive = numeric >= 0
            const isTop = index < 2
            return (
              <div key={feature} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink/80">
                  <span className={isTop ? 'font-semibold text-ink' : ''}>{feature}</span>
                  <span className="font-mono">{positive ? '+' : ''}{numeric.toFixed(2)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-[2px] border border-ink/40 bg-ink/10">
                  <div
                    className={`h-full ${positive ? 'bg-yellow' : 'bg-pink'}`}
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 border-t-2 border-[var(--border)] pt-3 text-sm text-ink/80">
        Final match score: <span style={{ color: getMatchColor(totalScore) }}>{scoreToPercent(totalScore)}</span>
      </div>
    </div>
  )
}

export default memo(SHAPChart)