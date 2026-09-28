import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import type { CalendarEvent } from "../../types/calendar";
import { cx } from "../../utils/class-names";
import { formatEventTime } from "../../utils/format";
import { ROUTES } from "../../utils/forum-constants";
import styles from "./calendar-event-card.module.css";

interface CalendarEventCardProps {
  event: CalendarEvent;
  /** "tag" for the small month-view pill, "block" for the week-view timeline block. */
  variant: "tag" | "block";
}

/** Link to an event's detail page: a small tag in month view, a fuller block in week view. */
export function CalendarEventCard({ event, variant }: CalendarEventCardProps): ReactElement {
  return (
    <Link
      to={ROUTES.calendarEvent(event.id)}
      className={cx(styles.card, styles[variant])}
      title={`${formatEventTime(event.time)} · ${event.title}`}
    >
      <span className={styles.time}>{formatEventTime(event.time)}</span>
      <span className={styles.title}>{event.title}</span>
    </Link>
  );
}
