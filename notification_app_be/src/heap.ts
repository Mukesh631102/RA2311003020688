/**
 * notification_app_be/src/heap.ts
 *
 * Generic Min-Heap keyed by a numeric score.
 * Used to maintain the top-N highest-scored notifications in O(log N) per insertion.
 *
 * WHY A MIN-HEAP?
 * We want the top-N highest scores. Keeping a min-heap of size N means the
 * root is always the LOWEST score in our "top N" set. When a new notification
 * arrives, we compare its score against the root:
 *   - If score > root → pop root (evict weakest) and push new item.
 *   - If score <= root → ignore (it can't improve the top-N set).
 * This gives us O(log N) per notification and O(1) peek at the minimum.
 */

export interface Heapable {
  score: number;
}

export class MinHeap<T extends Heapable> {
  private readonly data: T[] = [];

  get size(): number {
    return this.data.length;
  }

  /** The minimum-score item (root). */
  peek(): T | undefined {
    return this.data[0];
  }

  /** Insert a new item and restore the heap property. O(log n) */
  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  /** Remove and return the minimum-score item. O(log n) */
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  /** Return all items as a sorted array (highest score first). O(n log n) */
  toSortedDesc(): T[] {
    return [...this.data].sort((a, b) => b.score - a.score);
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent].score <= this.data[i].score) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left  = 2 * i + 1;
      const right = 2 * i + 2;
      if (left  < n && this.data[left].score  < this.data[smallest].score) smallest = left;
      if (right < n && this.data[right].score < this.data[smallest].score) smallest = right;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}
