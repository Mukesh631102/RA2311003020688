export interface NotificationItem {
  id: string;
  placement: number;
  result: number;
  event: number;
  timestamp: number; // Unix epoch or comparable timestamp
  message: string;
  isViewed: boolean;
}

/**
 * Calculates the top "n" notifications based on a priority queue system.
 * 
 * Primary Sorting Weight (Descending):
 * 1. Placement
 * 2. Result
 * 3. Event
 * 
 * Secondary Sorting Weight:
 * 4. Timestamp (Recency - Descending)
 */
export const getTopNotifications = (
  notifications: NotificationItem[],
  limit: number = 10
): NotificationItem[] => {
  const sorted = [...notifications].sort((a, b) => {
    // 1. Placement (Higher is better)
    if (a.placement !== b.placement) {
      return b.placement - a.placement;
    }
    
    // 2. Result (Higher is better)
    if (a.result !== b.result) {
      return b.result - a.result;
    }
    
    // 3. Event (Higher is better)
    if (a.event !== b.event) {
      return b.event - a.event;
    }
    
    // 4. Timestamp (More recent is better)
    return b.timestamp - a.timestamp;
  });

  return sorted.slice(0, limit);
};
