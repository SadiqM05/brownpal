import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";
import type { RaIdentity } from "../types/forum";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  subscribeToCalendarEvents,
  updateCalendarEvent,
} from "../utils/calendar-api";
import { describeError } from "../utils/errors";
import { mergeById } from "../utils/post-filters";
import { removeStoredFiles } from "../utils/storage";
import type { CalendarState } from "./calendar-context";

/**
 * Loads every calendar event and keeps them live through subscriptions
 * (onCreateCalendarEvent, onUpdateCalendarEvent, onDeleteCalendarEvent), and exposes the actions.
 */
export function useCalendarData(ra: RaIdentity): CalendarState {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const stop = subscribeToCalendarEvents(
      (event) => setEvents((prev) => mergeById(prev, [event])),
      (event) => setEvents((prev) => prev.filter((item) => item.id !== event.id)),
      (cause) => {
        if (active) setError(describeError(cause));
      },
    );

    fetchCalendarEvents()
      .then((loaded) => {
        if (!active) return;
        setEvents((prev) => mergeById(prev, loaded));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeError(cause));
        setLoading(false);
      });

    return () => {
      active = false;
      stop();
    };
  }, []);

  const createEvent = useCallback(
    async (input: CalendarEventInput): Promise<CalendarEvent> => {
      const event = await createCalendarEvent(ra, input);
      setEvents((prev) => mergeById(prev, [event]));
      return event;
    },
    [ra],
  );

  const updateEvent = useCallback(async (eventId: string, input: CalendarEventInput): Promise<CalendarEvent> => {
    const event = await updateCalendarEvent(eventId, input);
    setEvents((prev) => mergeById(prev, [event]));
    return event;
  }, []);

  const deleteEvent = useCallback(async (event: CalendarEvent): Promise<void> => {
    await deleteCalendarEvent(event.id);
    setEvents((prev) => prev.filter((item) => item.id !== event.id));
    const fileKeys = (event.attachments ?? []).filter((key): key is string => Boolean(key));
    if (fileKeys.length > 0) void removeStoredFiles(fileKeys);
  }, []);

  return useMemo(
    () => ({ events, loading, error, createEvent, updateEvent, deleteEvent }),
    [events, loading, error, createEvent, updateEvent, deleteEvent],
  );
}
