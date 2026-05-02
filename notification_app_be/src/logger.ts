/**
 * notification_app_be/src/logger.ts
 * Logger wrapper — re-exports LoggerClient from the shared middleware package.
 * Binds stack="frontend" (per frontend-track requirements) and reads config from env.
 */

import "dotenv/config";
import { LoggerClient } from "../../logging_middleware/dist/logger";
import type { Level, Package } from "../../logging_middleware/dist/types";

const client = new LoggerClient({
  email:        process.env.EMAIL         ?? "",
  name:         process.env.CLIENT_NAME   ?? "",
  rollNo:       process.env.ROLL_NO       ?? "",
  accessCode:   process.env.ACCESS_CODE   ?? "",
  clientID:     process.env.CLIENT_ID     ?? "",
  clientSecret: process.env.CLIENT_SECRET ?? "",
  consoleEcho:  true,
});

/**
 * Log(level, pkg, message)
 * Sends a log to the evaluation service with stack fixed to "frontend".
 */
export async function Log(level: Level, pkg: Package, message: string): Promise<void> {
  await client.Log("frontend", level, pkg, message);
}
