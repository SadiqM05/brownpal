import type { ReactElement } from "react";
import { formatEventDate, formatEventTime } from "../../utils/format";
import { FileLink } from "../file-link/file-link";
import styles from "./event-details-card.module.css";

interface EventDetailsCardProps {
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  /** S3 key of the event flyer. */
  flyer?: string | null;
}

/** Shows the date, time, location and flyer of a Programs & Events post. */
export function EventDetailsCard({ eventDate, eventTime, location, flyer }: EventDetailsCardProps): ReactElement {
  return (
    <section className={styles.card} aria-label="Event details">
      <h2 className={styles.heading}>Event details</h2>
      <dl className={styles.list}>
        {eventDate && (
          <div className={styles.row}>
            <dt>Date</dt>
            <dd>{formatEventDate(eventDate)}</dd>
          </div>
        )}
        {eventTime && (
          <div className={styles.row}>
            <dt>Time</dt>
            <dd>{formatEventTime(eventTime)}</dd>
          </div>
        )}
        {location && (
          <div className={styles.row}>
            <dt>Location</dt>
            <dd>{location}</dd>
          </div>
        )}
        {flyer && (
          <div className={styles.row}>
            <dt>Flyer</dt>
            <dd>
              <FileLink storageKey={flyer} />
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
