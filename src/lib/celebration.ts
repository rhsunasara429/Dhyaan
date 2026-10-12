/* Completion celebration rules (M6).
 *
 * Pure on purpose: every count is supplied by the caller *before* the toggle
 * is applied, so the tier a user earns is deterministic and unit-testable
 * without touching React, the DOM, or storage.
 */

export type CelebrationTier = 'clear' | 'milestone'

export type Celebration = {
  tier: CelebrationTier
  message: string
  /** Second line, shown smaller under the main message. */
  sub: string | null
}

export type CelebrationInput = {
  /** True when an open task is being completed (not un-completed). */
  completing: boolean
  /** True when the task being completed belongs to the Today list. */
  inToday: boolean
  /** Open tasks in Today, counted before this completion. */
  todayRemaining: number
  /** Tasks completed today, counted before this completion. */
  completedToday: number
}

/** Completion counts that earn a full burst. */
export const MILESTONES: readonly number[] = [3, 5, 10, 20, 50]

/**
 * Returns the celebration to show, or null when the completion should only get
 * the lightweight tap feedback.
 *
 * Tiering matters: a burst on every tap is visual noise by the fifth task. The
 * micro-feedback is always on, so rewarding the rarer moments still lands.
 */
export function resolveCelebration(input: CelebrationInput): Celebration | null {
  if (!input.completing) return null

  if (input.inToday && input.todayRemaining <= 1) {
    return {
      tier: 'clear',
      message: 'Today is clear',
      sub: 'Everything done for the day.',
    }
  }

  const next = input.completedToday + 1
  if (MILESTONES.includes(next)) {
    return {
      tier: 'milestone',
      message: `${next} done today`,
      sub: 'Keep the streak moving.',
    }
  }

  return null
}