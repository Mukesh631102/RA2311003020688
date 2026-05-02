/**
 * Types mirrored from logging_middleware for use in the notification app.
 */

export type Stack = "frontend" | "backend";
export type Level = "debug" | "info" | "warn" | "error" | "fatal";
export type Package =
  | "api" | "component" | "hook" | "page" | "state" | "style"
  | "cache" | "controller" | "cron_job" | "db" | "domain"
  | "handler" | "repository" | "route" | "service"
  | "auth" | "config" | "middleware" | "utils";
