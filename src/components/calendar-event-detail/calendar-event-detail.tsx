import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "../../hooks/use-calendar";
import { useCurrentRa } from "../../hooks/use-current-ra";
import shared from "../../styles/shared.module.css";
import type { CalendarEvent } from "../../types/calendar";
import { describeError } from "../../utils/errors";
import { formatEventDate, formatEventTime } from "../../utils/format";
import { ROUTES } from "../../utils/forum-constants";
import { AuthorLink } from "../author-link/author-link";
import { CalendarEventModal } from "../calendar-event-modal/calendar-event-modal";
import { ConfirmDialog } from "../confirm-dialog/confirm-dialog";
import { FileLink } from "../file-link/file-link";
import styles from "./calendar-event-detail.module.css";

interface CalendarEventDetailProps {
  event: CalendarEvent;
}

/** Full calendar event: date, time, description, attachments, author, and edit/delete for its creator. */
export function CalendarEventDetail({ event }: CalendarEventDetailProps): ReactElement {
  const ra = useCurrentRa();
  const navigate = useNavigate();
  const { deleteEvent } = useCalendar();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAuthor = event.authorId === ra.userId;
  const attachments = (event.attachments ?? []).filter((key): key is string => key !== null);

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(event);
      navigate(ROUTES.calendar);
    } catch (cause) {
      setDeleteError(describeError(cause));
      setDeleting(false);
    }
  }

  return (
    <article className={styles.event}>
      <header className={styles.header}>
        <h1 className={styles.title}>{event.title}</h1>
        <p className={styles.meta}>
          <span>{formatEventDate(event.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatEventTime(event.time)}</span>
        </p>
        <div className={styles.author}>
          <AuthorLink userId={event.authorId} fallbackName={event.authorName} avatarSize="md" />
        </div>
        {isAuthor && (
          <div className={styles.actions}>
            <button
              type="button"
              className={`${shared.button} ${shared.secondary} ${shared.small}`}
              onClick={() => setEditing(true)}
            >
              Edit event
            </button>
            <button
              type="button"
              className={`${shared.button} ${shared.secondary} ${shared.small}`}
              onClick={() => setDeleteOpen(true)}
            >
              Delete event
            </button>
          </div>
        )}
      </header>

      <p className={styles.description}>{event.description}</p>

      {attachments.length > 0 && (
        <section aria-labelledby={`attachments-${event.id}`} className={styles.attachments}>
          <h2 id={`attachments-${event.id}`} className={styles.subheading}>
            Attachments
          </h2>
          <ul className={styles.attachmentList}>
            {attachments.map((key) => (
              <li key={key}>
                <FileLink storageKey={key} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <CalendarEventModal event={event} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete this event?"
          message="This removes the event for everyone. This cannot be undone."
          confirmLabel="Delete event"
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            setDeleteOpen(false);
            setDeleteError(null);
          }}
          confirming={deleting}
          error={deleteError}
        />
      )}
    </article>
  );
}
