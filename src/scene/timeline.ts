/**
 * Storyboard segment boundaries, in seconds: closed+wobble | fold2 opens | front flap tips |
 * slip peels up (pinned at the crease) | slip rises | slip levels | slip descends/grows/settles.
 */
export const SEGMENT_SECONDS = [0, 0.5, 1.3, 1.7, 2.0, 2.5, 2.8, 3.9] as const

/** Total length of the motion, in seconds — t=1 in drawFrame corresponds to this many seconds. */
export const MOTION_SECONDS = 3.9

/** How long the final frame should be held in the exported GIF (via frame delay, not duplicate frames). */
export const HOLD_SECONDS = 4
