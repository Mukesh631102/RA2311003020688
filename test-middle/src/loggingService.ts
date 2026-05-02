/**
 * Logging Middleware Package for React + Vite
 * 
 * This module provides a reusable logging function that sends formatted log payloads
 * to the remote evaluation service. It includes strict validation for log levels and
 * package identifiers, and supports authenticated requests via a token helper.
 */

// Define allowed union types for TypeScript intellisense and compile-time checks
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogPackage = 
  | "apf" | "component" | "hook" | "page" | "state" | "style" // Frontend specific
  | "auth" | "config" | "middleware" | "utils";               // General

// Define Sets for fast runtime validation
const ALLOWED_LEVELS = new Set<string>(["debug", "info", "warn", "error", "fatal"]);
const ALLOWED_PACKAGES = new Set<string>([
  "apf", "component", "hook", "page", "state", "style",
  "auth", "config", "middleware", "utils"
]);

const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

let authToken: string | null = null;

/**
 * Configures the authentication token for subsequent remote log requests.
 * 
 * @param token The JWT or Bearer token (without the "Bearer " prefix).
 *              Pass null to clear the current token.
 */
export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

/**
 * Sends a validated log message to the remote evaluation logging service.
 * 
 * @param level The severity level of the log.
 * @param pkg The origin package or module of the log.
 * @param message The detailed log message.
 */
export const Log = async (level: LogLevel, pkg: LogPackage, message: string): Promise<void> => {
  // Runtime validation to ensure compliance with the specification
  if (!ALLOWED_LEVELS.has(level)) {
    console.error(`[LoggingService] Validation Error: Invalid log level '${level}'.`);
    return;
  }

  if (!ALLOWED_PACKAGES.has(pkg)) {
    console.error(`[LoggingService] Validation Error: Invalid log package '${pkg}'.`);
    return;
  }

  if (!message || typeof message !== "string" || message.trim() === "") {
    console.error(`[LoggingService] Validation Error: Message must be a non-empty string.`);
    return;
  }

  // Construct payload precisely as required
  const payload = {
    stack: "frontend",
    level,
    package: pkg,
    message
  };

  // Configure headers, including the authorization token if it has been set
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Intentionally not throwing an error to prevent logging failures from crashing the app
      console.error(`[LoggingService] Delivery Failed: Received status ${response.status} from logging server.`);
    }
  } catch (error) {
    console.error(`[LoggingService] Network Error: Could not reach logging server.`, error);
  }
};

/* 
================================================================================
EXAMPLE USAGE:
================================================================================

import { Log, setAuthToken } from './loggingService';

// 1. Initialize the authentication token after a successful user login
//    (Usually done in an auth provider or context)
const handleLoginSuccess = (token: string) => {
  setAuthToken(token);
};

// 2. Utilize the Log function throughout your application components
const fetchUserProfile = async (userId: string) => {
  Log("info", "component", `Initiating profile fetch for user ${userId}`);
  
  try {
    const response = await api.getUser(userId);
    Log("debug", "state", "User profile fetched and state updated successfully.");
    return response.data;
  } catch (error) {
    Log("error", "utils", `Profile fetch failed with error: ${error.message}`);
  }
};

================================================================================
*/
