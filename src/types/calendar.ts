import type { Schema } from "../../amplify/data/resource";

export type CalendarEvent = Schema["CalendarEvent"]["type"];

/** Which calendar layout is showing. */
export type CalendarViewMode = "month" | "week";

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
