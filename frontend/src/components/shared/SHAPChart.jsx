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
    <div className="rounded-[8px] border border-(--border) bg-(--bg-card) p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-[13px] font-bold uppercase tracking-wider text-(--text-primary)">Match Reasoning</h3>
        <span className="font-mono text-[10px] font-bold text-(--text-muted)">FACTOR IMPACT</span>
      </div>
      <p className="mb-5 text-[12px] leading-relaxed text-(--text-secondary)">Longer bars indicate a stronger mathematical influence on your final match score.</p>

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
              <div key={feature} className="space-y-1.5 flex flex-col">
                <div className="flex items-center justify-between text-[12px] text-(--text-secondary)">
                  <span className={isTop ? 'font-semibold text-(--text-primary)' : ''}>{feature}</span>
                  <span className="font-mono text-[11px] font-medium">{positive ? '+' : ''}{numeric.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-subtle)">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${positive ? 'bg-(--accent-yellow)' : 'bg-(--danger)'}`}
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 border-t border-(--border) pt-4 text-[13px] font-medium text-(--text-secondary)">
        Calculated alignment: <span className="font-bold font-mono" style={{ color: getMatchColor(totalScore) }}>{scoreToPercent(totalScore)}</span>
      </div>
    </div>
  )
}

export default memo(SHAPChart)