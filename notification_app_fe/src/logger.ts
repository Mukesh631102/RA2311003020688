/**
 * logger.ts
 * Bridges the external logging_middleware package into the notification app.
 * Handles auto-auth token management via the evaluation service.
 */

import axios from "axios";
import type { Level, Package } from "./types";

// Using relative paths so Vite proxy handles CORS
const AUTH_PATH = "/evaluation-service/auth";
const LOGS_PATH = "/evaluation-service/logs";
const TOKEN_BUFFER_S = 60;

interface AuthCredentials {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

let authCredentials: AuthCredentials | null = null;
let accessToken: string | null = null;
let tokenExpiresAt = 0;

const http = axios.create({
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

/** Configure the authentication credentials at runtime */
export function setCredentials(creds: AuthCredentials): void {
  authCredentials = creds;
  // Invalidate existing token so next call re-authenticates
  accessToken = null;
  tokenExpiresAt = 0;
}

/** Check if credentials have been configured */
export function hasCredentials(): boolean {
  return authCredentials !== null;
}

/** Fetches a fresh auth token from the evaluation service */
async function refreshToken(): Promise<string> {
  if (!authCredentials) {
    throw new Error("Auth credentials not configured. Call setCredentials() first.");
  }

  const response = await http.post(AUTH_PATH, {
    email:        authCredentials.email.toLowerCase(),
    name:         authCredentials.name.toLowerCase(),
    rollNo:       authCredentials.rollNo.toLowerCase(),
    accessCode:   authCredentials.accessCode,
    clientID:     authCredentials.clientID,
    clientSecret: authCredentials.clientSecret,
  });

  const { access_token, expires_in } = response.data;
  accessToken = access_token;
  tokenExpiresAt = expires_in; // Unix timestamp
  return access_token;
}

/** Returns a valid token, refreshing if needed */
async function getToken(): Promise<string> {
  const nowS = Math.floor(Date.now() / 1000);
  if (accessToken && nowS < tokenExpiresAt - TOKEN_BUFFER_S) {
    return accessToken;
  }
  return refreshToken();
}

/**
 * Returns the current bearer token (for use in notification fetching).
 * Will auto-authenticate if no token exists yet.
 */
export async function getBearerToken(): Promise<string> {
  return getToken();
}

/**
 * Log(stack, level, package, message)
 * Sends a structured log entry to the evaluation service.
 * All logging in this application MUST go through this function.
 */
export async function Log(
  stack: "frontend",
  level: Level,
  pkg: Package,
  message: string
): Promise<void> {
  if (!authCredentials) return; // Skip if not configured yet

  const payload = { stack, level, package: pkg, message };

  try {
    const token = await getToken();
    await http.post(LOGS_PATH, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Swallow logging errors — never crash the consuming app
  }
}
