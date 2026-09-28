import type { CalendarEvent } from "../types/calendar";

export const DAYS_PER_WEEK = 7;
export const HOURS_PER_DAY = 24;
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Formats a Date as an AWSDate ("YYYY-MM-DD") using local time, not UTC. */
export function toAwsDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses an AWSDate ("YYYY-MM-DD") as a local-time Date at midnight, avoiding UTC shifting. */
export function parseAwsDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Hour (0-23) an AWSTime ("HH:mm[:ss[.sss]]") falls in. */
export function hourOf(time: string): number {
  return Number(time.slice(0, 2));
}

/** The Sunday that starts the week containing the given date. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/** The Sunday on or before the first of the month. */
export function startOfMonthGrid(date: Date): Date {
  return startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
}

/**
 * Every day shown in a month's grid, as full weeks (a multiple of 7 days: usually 35, sometimes
 * 42), starting on the Sunday on or before the 1st and continuing through the last day of the month.
 */
export function buildMonthGrid(month: Date): Date[] {
  const gridStart = startOfMonthGrid(month);
  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysThroughMonthEnd = Math.round((lastOfMonth.getTime() - gridStart.getTime()) / msPerDay) + 1;
  const totalCells = Math.ceil(daysThroughMonthEnd / DAYS_PER_WEEK) * DAYS_PER_WEEK;
  return Array.from({ length: totalCells }, (_, index) => addDays(gridStart, index));
}

/** Adds a number of days to a date, returning a new Date. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** True when two dates fall on the same local calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Groups events by their AWSDate, each day's events sorted by time. */
export function groupEventsByDate(events: readonly CalendarEvent[]): ReadonlyMap<string, CalendarEvent[]> {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const dayEvents = byDate.get(event.date) ?? [];
    dayEvents.push(event);
    byDate.set(event.date, dayEvents);
  }
  for (const dayEvents of byDate.values()) dayEvents.sort((a, b) => a.time.localeCompare(b.time));
  return byDate;
}

/** Formats an hour (0-23) as a 12-hour label, such as "2 PM". */
export function formatHourLabel(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: "numeric" });
}
