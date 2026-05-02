export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogPackage = 
  | "apf" | "component" | "hook" | "page" | "state" | "style"
  | "auth" | "config" | "middleware" | "utils";

const ALLOWED_LEVELS = new Set<string>(["debug", "info", "warn", "error", "fatal"]);
const ALLOWED_PACKAGES = new Set<string>([
  "apf", "component", "hook", "page", "state", "style",
  "auth", "config", "middleware", "utils"
]);

const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const Log = async (
  stack: string,
  level: LogLevel,
  pkg: LogPackage,
  message: string
): Promise<void> => {
  if (stack !== "frontend") {
    // Only "frontend" is permitted for this application
  }

  if (!ALLOWED_LEVELS.has(level)) return;
  if (!ALLOWED_PACKAGES.has(pkg)) return;
  if (!message || message.trim() === "") return;

  const payload = {
    stack: stack, // Should always be "frontend"
    level,
    package: pkg,
    message
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    // Fail silently to prevent telemetry issues from crashing the UI
  }
};
