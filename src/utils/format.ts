import { EXCERPT_LENGTH } from "./forum-constants";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** Formats an ISO timestamp as "just now", "5m ago", "3h ago", "2d ago", or a calendar date. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE_MS) return "just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  if (elapsed < WEEK_MS) return `${Math.floor(elapsed / DAY_MS)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats an AWSDate ("YYYY-MM-DD") without shifting it across time zones. */
export function formatEventDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats an AWSDate birthday as month and day only, such as "March 4". */
export function formatBirthday(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

/** Formats an AWSTime ("HH:mm[:ss[.sss]]") as a local time such as "6:30 PM". */
export function formatEventTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Shortens text to the excerpt length, adding an ellipsis when it was cut. */
export function toExcerpt(text: string): string {
  const flattened = text.replace(/\s+/g, " ").trim();
  return flattened.length > EXCERPT_LENGTH
    ? `${flattened.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : flattened;
}

/** Extracts a readable file name from a storage key such as "forum/id/uuid-flyer.pdf". */
export function fileNameFromKey(key: string): string {
  const last = key.split("/").pop() ?? key;
  return last.replace(/^[0-9a-f-]{36}-/, "");
}
