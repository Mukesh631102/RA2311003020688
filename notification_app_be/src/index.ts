/**
 * notification_app_be/src/index.ts
 *
 * Stage 1 — Priority Inbox entry point.
 * Fetches notifications from the evaluation API, computes priority scores
 * using a min-heap, and prints the top-N results to stdout.
 *
 * Usage:
 *   npx ts-node src/index.ts [topN]
 *   Example: npx ts-node src/index.ts 10
 */

import "dotenv/config";
import axios from "axios";
import { Log } from "./logger";
import { getTopN } from "./priorityScore";
import { Notification, NotificationsApiResponse } from "./types";

const BASE_URL    = "http://20.207.122.201";
const AUTH_PATH   = "/evaluation-service/auth";
const NOTIF_PATH  = "/evaluation-service/notifications";

/** Authenticate and return a Bearer token. */
async function getAuthToken(): Promise<string> {
  await Log("debug", "auth", "Requesting auth token from evaluation service");

  const response = await axios.post<{ access_token: string; expires_in: number }>(
    `${BASE_URL}${AUTH_PATH}`,
    {
      email:        process.env.EMAIL         ?? "",
      name:         process.env.CLIENT_NAME   ?? "",
      rollNo:       process.env.ROLL_NO       ?? "",
      accessCode:   process.env.ACCESS_CODE   ?? "",
      clientID:     process.env.CLIENT_ID     ?? "",
      clientSecret: process.env.CLIENT_SECRET ?? "",
    }
  );

  await Log("info", "auth", "Auth token obtained successfully");
  return response.data.access_token;
}

/** Fetch all notifications from the evaluation API (auto-paginate). */
async function fetchAllNotifications(token: string): Promise<Notification[]> {
  await Log("info", "api", "Fetching notifications from evaluation API");

  const response = await axios.get<NotificationsApiResponse>(
    `${BASE_URL}${NOTIF_PATH}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const notifications = response.data.notifications ?? [];
  await Log("info", "api", `Fetched ${notifications.length} notifications from API`);
  return notifications;
}

/** Pretty-print the scored priority list to stdout. */
function printResults(topN: ReturnType<typeof getTopN>, n: number): void {
  console.log(`\n${"═".repeat(70)}`);
  console.log(` TOP ${n} PRIORITY NOTIFICATIONS`);
  console.log(`${"═".repeat(70)}`);

  topN.forEach((notif, idx) => {
    const rank  = String(idx + 1).padStart(2, " ");
    const type  = notif.Type.padEnd(10);
    const score = notif.score.toExponential(4);
    console.log(`\n  #${rank}  [${type}]  ${notif.Message}`);
    console.log(`        ID        : ${notif.ID}`);
    console.log(`        Timestamp : ${notif.Timestamp}`);
    console.log(`        Score     : ${score}`);
  });

  console.log(`\n${"═".repeat(70)}\n`);
}

async function main(): Promise<void> {
  const topN = parseInt(process.argv[2] ?? "10", 10);

  await Log("info", "config", `Priority Inbox starting — computing top ${topN} notifications`);

  try {
    const token         = await getAuthToken();
    const notifications = await fetchAllNotifications(token);

    await Log("debug", "utils", `Processing ${notifications.length} notifications through priority heap`);

    const topNotifications = getTopN(notifications, topN);

    await Log("info", "utils", `Top ${topN} notifications computed successfully`);

    printResults(topNotifications, topN);

    await Log("info", "config", "Priority Inbox completed successfully");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await Log("fatal", "config", `Priority Inbox failed: ${msg}`);
    console.error("Fatal error:", msg);
    process.exit(1);
  }
}

main();
