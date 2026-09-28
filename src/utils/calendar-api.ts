import { client } from "../amplify/client";
import type { CalendarEvent, CalendarEventInput } from "../types/calendar";
import type { RaIdentity } from "../types/forum";

interface Page<T> {
  data: T[];
  nextToken?: string | null;
  errors?: ReadonlyArray<{ message: string }>;
}

/** Throws one Error when an Amplify Data response carries GraphQL errors. */
function assertNoErrors(errors?: ReadonlyArray<{ message: string }>): void {
  if (errors && errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }
}

/** Reads every page of a list query. */
async function collectPages<T>(fetchPage: (nextToken?: string) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const page = await fetchPage(nextToken ?? undefined);
    assertNoErrors(page.errors);
    items.push(...page.data);
    nextToken = page.nextToken;
  } while (nextToken);
  return items;
}

/** Loads every calendar event. */
export function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  return collectPages((nextToken) => client.models.CalendarEvent.list({ nextToken }));
}

/** Creates a calendar event authored by the given RA. */
export async function createCalendarEvent(ra: RaIdentity, input: CalendarEventInput): Promise<CalendarEvent> {
  const { data, errors } = await client.models.CalendarEvent.create({
    ...input,
    authorId: ra.userId,
    authorName: ra.displayName,
  });
  assertNoErrors(errors);
  if (!data) throw new Error("The event could not be created.");
  return data;
}

/** Updates a calendar event. The backend only allows the event's creator to do this. */
export async function updateCalendarEvent(eventId: string, input: CalendarEventInput): Promise<CalendarEvent> {
  const { data, errors } = await client.models.CalendarEvent.update({ id: eventId, ...input });
  assertNoErrors(errors);
  if (!data) throw new Error("The event could not be updated.");
  return data;
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
  const created = client.models.CalendarEvent.onCreate().subscribe({ next: onUpsert, error: onError });
  const updated = client.models.CalendarEvent.onUpdate().subscribe({ next: onUpsert, error: onError });
  const deleted = client.models.CalendarEvent.onDelete().subscribe({ next: onDelete, error: onError });
  return () => {
    created.unsubscribe();
    updated.unsubscribe();
    deleted.unsubscribe();
  };
}
