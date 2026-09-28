import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarEventDetail } from "../components/calendar-event-detail/calendar-event-detail";
import { useCalendar } from "../hooks/use-calendar";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Page for one calendar event, looked up by the eventId route parameter. */
export function CalendarEventDetailPage(): ReactElement {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loading } = useCalendar();
  const event = events.find(({ id }) => id === eventId);

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <Link className={styles.back} to={ROUTES.calendar}>
        ← Back to calendar
      </Link>
      {event ? (
        <CalendarEventDetail event={event} />
      ) : (
        <p className={styles.status} role={loading ? "status" : "alert"}>
          {loading ? "Loading event…" : "This event could not be found."}
        </p>
      )}
    </div>
  );
}
