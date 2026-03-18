/*
 * WHO WRITES THIS: Frontend developer
 * WHAT THIS DOES: Utility functions — score to %, date formatting,
 *                 text truncation, match color by score
 * DEPENDS ON: nothing
 */
export const scoreToPercent = (score) => `${Math.round(score * 100)}%`;
export const formatDate = (iso) => iso;
export const truncateText = (text, max) => text;
export const getMatchColor = (score) => "#FFE135";