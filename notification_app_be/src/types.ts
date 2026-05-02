/**
 * notification_app_be/src/types.ts
 * Shared types for the notification priority inbox.
 */

/** Notification as returned by the evaluation service API */
export interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string; // "YYYY-MM-DD HH:MM:SS"
}

export type NotificationType = "Placement" | "Result" | "Event";

/** A notification enriched with its computed priority score */
export interface ScoredNotification extends Notification {
  score: number;
}

/** Paginated API response from GET /evaluation-service/notifications */
export interface NotificationsApiResponse {
  notifications: Notification[];
}
