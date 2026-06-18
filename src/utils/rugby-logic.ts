/**
 * Rugby League Standings Calculation Logic
 */

export const SCORING_RULES = {
  WIN: 4,
  DRAW: 2,
  BONUS_TRIES: 1,
  BONUS_LOSS: 1,
  FORFEIT: -0.25,
}

interface RugbyStats {
  w: number
  t: number
  bt: number
  bl: number
  ff: number
  gp: number
  pf: number
  pa: number
}

/**
 * Calculates total league points based on match results and bonuses.
 */
export function calculateRugbyPoints(
  stats: Pick<RugbyStats, "w" | "t" | "bt" | "bl" | "ff">
): number {
  const { w, t, bt, bl, ff } = stats

  const winPts = w * SCORING_RULES.WIN
  const drawPts = t * SCORING_RULES.DRAW
  const bonusTryPts = bt * SCORING_RULES.BONUS_TRIES
  const bonusLossPts = bl * SCORING_RULES.BONUS_LOSS
  const forfeitPts = ff * SCORING_RULES.FORFEIT

  return winPts + drawPts + bonusTryPts + bonusLossPts + forfeitPts
}

/**
 * Calculates League Points Per Game (LPPG).
 */
export function calculateLPPG(points: number, gamesPlayed: number): string {
  if (gamesPlayed <= 0) return "0.00"
  return (points / gamesPlayed).toFixed(2)
}

/**
 * Calculates Point Differential (PD).
 */
export function calculatePD(pointsFor: number, pointsAgainst: number): number {
  return pointsFor - pointsAgainst
}
