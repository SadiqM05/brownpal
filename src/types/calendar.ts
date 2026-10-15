import type { Schema } from "../../amplify/data/resource";

export type CalendarEvent = Schema["CalendarEvent"]["type"];

/** Which calendar layout is showing. */
export type CalendarViewMode = "month" | "week";

/**
 * One item placed on the calendar grid: either a staff calendar event or a
 * Programs & Events forum post, reduced to what the month and week views need.
 */
export interface CalendarEntry {
  /** Unique across both sources. */
  key: string;
  source: "event" | "post";
  title: string;
  /** AWSDate ("YYYY-MM-DD"). */
  date: string;
  /** AWSTime ("HH:mm[:ss[.sss]]"). */
  time: string;
  /** Route of the entry's detail page. */
  href: string;
}

/** Values collected by the create/edit event modal. */
export interface CalendarEventInput {
  title: string;
  description: string;
  /** AWSDate ("YYYY-MM-DD"). */
  date: string;
  /** AWSTime ("HH:mm"). */
  time: string;
  attachments: string[];
}
