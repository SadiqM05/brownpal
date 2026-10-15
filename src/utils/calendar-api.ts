import { client } from "../amplify/client";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";
import type { Post } from "../types/forum";
import { assertNoErrors, collectPages, listen, stopAll, unwrap } from "./data-client";
import { CATEGORY_EVENTS } from "./forum-constants";

/** Loads every calendar event. */
export function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  return collectPages((nextToken) => client.models.CalendarEvent.list({ nextToken }));
}

/** Loads every Programs & Events post, from every term, for placing on the calendar. */
export function fetchEventPosts(): Promise<Post[]> {
  return collectPages((nextToken) =>
    client.models.Post.listPostsByCategory({ category: CATEGORY_EVENTS }, { nextToken }),
  );
}

/** Creates a calendar event. The backend records the signed-in RA as its owner. */
export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const result = await client.models.CalendarEvent.create(input);
  return unwrap(result, "The event could not be created.");
}

/** Updates a calendar event. The backend only allows the event's creator to do this. */
export async function updateCalendarEvent(eventId: string, input: CalendarEventInput): Promise<CalendarEvent> {
  const result = await client.models.CalendarEvent.update({ id: eventId, ...input });
  return unwrap(result, "The event could not be updated.");
}

/** Deletes a calendar event. The backend only allows the event's creator to do this. */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const { errors } = await client.models.CalendarEvent.delete({ id: eventId });
  assertNoErrors(errors);
}

/** Subscribes to created, updated and deleted calendar events. Returns a function that stops every subscription. */
export function subscribeToCalendarEvents(
  onUpsert: (event: CalendarEvent) => void,
  onDelete: (event: CalendarEvent) => void,
  onError: (error: unknown) => void,
): () => void {
  return stopAll(
    listen(client.models.CalendarEvent.onCreate(), onUpsert, onError),
    listen(client.models.CalendarEvent.onUpdate(), onUpsert, onError),
    listen(client.models.CalendarEvent.onDelete(), onDelete, onError),
  );
}
