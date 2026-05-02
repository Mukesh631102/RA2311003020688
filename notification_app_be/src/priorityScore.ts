/**
 * notification_app_be/src/priorityScore.ts
 *
 * Priority scoring formula and top-N maintenance logic.
 *
 * SCORING FORMULA
 * ───────────────
 *   score = typeWeight × 10¹⁵ + timestampMs
 *
 * Type weights (higher = more important):
 *   Placement → 3
 *   Result    → 2
 *   Event     → 1
 *
 * WHY 10¹⁵?
 *   Current Unix timestamps in ms are ~1.75 × 10¹², which is safely less than
 *   10¹⁵. Multiplying the type weight by 10¹⁵ guarantees that type always
 *   dominates, while the timestamp component breaks ties within the same type
 *   (larger timestamp = more recent = higher priority).
 *
 * MAINTAINING TOP-N EFFICIENTLY
 * ──────────────────────────────
 *   A min-heap of fixed size N is maintained. For each incoming notification:
 *     1. Compute its score.
 *     2. If heap.size < N  →  push unconditionally.
 *     3. Else if score > heap.peek().score  →  pop min, push new.
 *     4. Else  →  discard (cannot improve the top-N set).
 *   Time: O(log N) per notification.  Space: O(N).
 */

import { MinHeap } from "./heap";
import { Notification, ScoredNotification, NotificationType } from "./types";

const TYPE_WEIGHT: Record<NotificationType, number> = {
  Placement: 3,
  Result:    2,
  Event:     1,
};

const WEIGHT_MULTIPLIER = 1e15;

/** Compute the priority score for a single notification. */
export function computeScore(n: Notification): number {
  const weight      = TYPE_WEIGHT[n.Type] ?? 0;
  const timestampMs = new Date(n.Timestamp).getTime();
  return weight * WEIGHT_MULTIPLIER + timestampMs;
}

/**
 * Process an array of notifications and return the top-N by priority score.
 * Simulates real-time ingestion: notifications are fed one-by-one into a
 * fixed-size min-heap, matching the behaviour when notifications arrive as a stream.
 *
 * @param notifications - Full list of notifications from the API
 * @param n             - How many top notifications to return (default 10)
 */
export function getTopN(notifications: Notification[], n: number = 10): ScoredNotification[] {
  const heap = new MinHeap<ScoredNotification>();

  for (const notification of notifications) {
    const score = computeScore(notification);
    const scored: ScoredNotification = { ...notification, score };

    if (heap.size < n) {
      // Heap not full yet — add unconditionally
      heap.push(scored);
    } else if (heap.peek() && score > heap.peek()!.score) {
      // New notification beats the current weakest in our top-N
      heap.pop();
      heap.push(scored);
    }
    // Otherwise: this notification is not in the top-N — skip
  }

  // Return sorted highest-score-first
  return heap.toSortedDesc();
}
