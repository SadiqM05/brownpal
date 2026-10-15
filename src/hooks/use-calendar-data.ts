import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";
import type { Post } from "../types/forum";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  fetchEventPosts,
  subscribeToCalendarEvents,
  updateCalendarEvent,
} from "../utils/calendar-api";
import { describeError } from "../utils/errors";
import { subscribeToPosts } from "../utils/forum-api";
import { CATEGORY_EVENTS } from "../utils/forum-constants";
import { mergeById } from "../utils/post-filters";
import { removeStoredFiles } from "../utils/storage";
import type { CalendarState } from "./calendar-context";

/** Removes one record from a list by id. */
function dropById<T extends { id: string }>(id: string) {
  return (prev: T[]): T[] => prev.filter((item) => item.id !== id);
}

/**
 * Loads every calendar event and every Programs & Events post, keeps both live through
 * subscriptions, and exposes the event actions. A post that is edited out of Programs & Events
 * leaves the calendar.
 */
export function useCalendarData(): CalendarState {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventPosts, setEventPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const reportError = (cause: unknown): void => {
      if (active) setError(describeError(cause));
    };
    const stopEvents = subscribeToCalendarEvents(
      (event) => setEvents((prev) => mergeById(prev, [event])),
      (event) => setEvents(dropById(event.id)),
      reportError,
    );
    const stopPosts = subscribeToPosts(
      (post) =>
        setEventPosts(post.category === CATEGORY_EVENTS ? (prev) => mergeById(prev, [post]) : dropById(post.id)),
      (post) => setEventPosts(dropById(post.id)),
      reportError,
    );

    Promise.all([fetchCalendarEvents(), fetchEventPosts()])
      .then(([loadedEvents, loadedPosts]) => {
        if (!active) return;
        setEvents((prev) => mergeById(prev, loadedEvents));
        setEventPosts((prev) => mergeById(prev, loadedPosts));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeError(cause));
        setLoading(false);
      });

    return () => {
      active = false;
      stopEvents();
      stopPosts();
    };
  }, []);

  const createEvent = useCallback(async (input: CalendarEventInput): Promise<CalendarEvent> => {
    const event = await createCalendarEvent(input);
    setEvents((prev) => mergeById(prev, [event]));
    return event;
  }, []);

  const updateEvent = useCallback(async (eventId: string, input: CalendarEventInput): Promise<CalendarEvent> => {
    const event = await updateCalendarEvent(eventId, input);
    setEvents((prev) => mergeById(prev, [event]));
    return event;
  }, []);

  const deleteEvent = useCallback(async (event: CalendarEvent): Promise<void> => {
    await deleteCalendarEvent(event.id);
    setEvents(dropById(event.id));
    const fileKeys = (event.attachments ?? []).filter((key): key is string => Boolean(key));
    if (fileKeys.length > 0) void removeStoredFiles(fileKeys);
  }, []);

  return useMemo(
    () => ({ events, eventPosts, loading, error, createEvent, updateEvent, deleteEvent }),
    [events, eventPosts, loading, error, createEvent, updateEvent, deleteEvent],
  );
}
