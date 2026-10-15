import type { CalendarEntry, CalendarEvent } from "../types/calendar";
import type { Post } from "../types/forum";
import { CATEGORY_EVENTS, ROUTES } from "./forum-constants";

/**
 * Everything shown on the calendar: staff calendar events plus Programs & Events posts.
 * Posts are projected rather than copied into CalendarEvent, so a new or deleted post shows
 * up here through the forum's own live data with nothing to keep in sync. A post needs both
 * an event date and an event time to be placed, which the create-post form requires.
 */
export function buildCalendarEntries(events: readonly CalendarEvent[], posts: readonly Post[]): CalendarEntry[] {
  const entries: CalendarEntry[] = events.map((event) => ({
    key: `event-${event.id}`,
    source: "event",
    title: event.title,
    date: event.date,
    time: event.time,
    href: ROUTES.calendarEvent(event.id),
  }));

  for (const post of posts) {
    if (post.category !== CATEGORY_EVENTS || !post.eventDate || !post.eventTime) continue;
    entries.push({
      key: `post-${post.id}`,
      source: "post",
      title: post.title,
      date: post.eventDate,
      time: post.eventTime,
      href: ROUTES.post(post.id),
    });
  }
  return entries;
}
