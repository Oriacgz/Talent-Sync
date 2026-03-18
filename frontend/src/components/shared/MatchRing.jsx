/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Circular SVG progress ring showing match percentage.
 *                 Color changes by score: cyan (high), yellow (mid), pink (low).
 *                 Animates on mount via strokeDashoffset transition.
 * DEPENDS ON: formatters.js (getMatchColor, scoreToPercent)
 * PROPS: score (0-1), size (default 56), strokeWidth (default 4)
 */
export default function MatchRing({ score = 0, size = 56 }) {
  return <div>{Math.round(score * 100)}%</div>;
}