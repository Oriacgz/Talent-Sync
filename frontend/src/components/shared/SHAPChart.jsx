/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Horizontal waterfall bar chart showing SHAP feature
 *                 contributions. Positive = yellow bar right. Negative = pink bar left.
 *                 Bars animate from 0 to final width on mount.
 *                 Shows final score at bottom.
 * DEPENDS ON: formatters.js (scoreToPercent, getMatchColor)
 * PROPS: shapValues (object), totalScore (float 0-1)
 */
export default function SHAPChart({ shapValues, totalScore }) {
  return <div>SHAP Chart — {JSON.stringify(shapValues)}</div>;
}