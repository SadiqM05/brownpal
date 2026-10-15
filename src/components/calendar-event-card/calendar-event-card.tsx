import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import type { CalendarEntry } from "../../types/calendar";
import { cx } from "../../utils/class-names";
import { formatEventTime } from "../../utils/format";
import styles from "./calendar-event-card.module.css";

interface CalendarEventCardProps {
  entry: CalendarEntry;
  /** "tag" for the small month-view pill, "block" for the week-view timeline block. */
  variant: "tag" | "block";
}

/**
 * Link to an entry's detail page (the event, or the forum post it came from): a small tag in
 * month view, a fuller block in week view. Forum posts are tinted differently from staff events.
 */
export function CalendarEventCard({ entry, variant }: CalendarEventCardProps): ReactElement {
  const isPost = entry.source === "post";
  const time = formatEventTime(entry.time);
  return (
    <Link
      to={entry.href}
      className={cx(styles.card, styles[variant], isPost && styles.post)}
      title={`${time} · ${entry.title}${isPost ? " (forum post)" : ""}`}
    >
      <span className={styles.time}>{time}</span>
      <span className={styles.title}>{entry.title}</span>
    </Link>
  );
}
