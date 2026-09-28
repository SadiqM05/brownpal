import { createContext } from "react";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";

/** Shared calendar events and the actions that change them. */
export interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  createEvent: (input: CalendarEventInput) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, input: CalendarEventInput) => Promise<CalendarEvent>;
  /** Deletes an event (its own creator only) along with its uploaded attachments. */
  deleteEvent: (event: CalendarEvent) => Promise<void>;
}

export const CalendarContext = createContext<CalendarState | null>(null);
