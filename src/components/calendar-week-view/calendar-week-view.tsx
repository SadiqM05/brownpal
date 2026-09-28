import { useEffect, useMemo, useRef, type ReactElement } from "react";
import type { CalendarEvent } from "../../types/calendar";
import {
  addDays,
  formatHourLabel,
  HOURS_PER_DAY,
  hourOf,
  isSameDay,
  toAwsDate,
  WEEKDAY_LABELS,
} from "../../utils/calendar-dates";
import { cx } from "../../utils/class-names";
import { WEEK_VIEW_DEFAULT_SCROLL_HOUR } from "../../utils/forum-constants";
import { CalendarEventCard } from "../calendar-event-card/calendar-event-card";
import styles from "./calendar-week-view.module.css";

interface CalendarWeekViewProps {
  /** Sunday that starts the displayed week. */
  weekStart: Date;
  eventsByDate: ReadonlyMap<string, CalendarEvent[]>;
}

const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);

/** Hourly timeline: one column per day, events placed as blocks in their starting hour. */
export function CalendarWeekView({ weekStart, eventsByDate }: CalendarWeekViewProps): ReactElement {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const today = new Date();
  const bodyRef = useRef<HTMLDivElement>(null);

  // Open scrolled to a typical start of day instead of midnight.
  useEffect(() => {
    bodyRef.current
      ?.querySelector(`[data-hour="${WEEK_VIEW_DEFAULT_SCROLL_HOUR}"]`)
      ?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div className={styles.timeline}>
      <div className={styles.headerRow}>
        <div className={styles.corner} aria-hidden="true" />
        {days.map((day) => (
          <div key={day.toISOString()} className={cx(styles.dayHeader, isSameDay(day, today) && styles.today)}>
            <span className={styles.dayName}>{WEEKDAY_LABELS[day.getDay()]}</span>
            <span className={styles.dayNumber}>{day.getDate()}</span>
          </div>
        ))}
      </div>
      <div className={styles.body} ref={bodyRef}>
        {HOURS.map((hour) => (
          <div key={hour} data-hour={hour} className={styles.hourRow}>
            <div className={styles.hourLabel}>{formatHourLabel(hour)}</div>
            {days.map((day) => {
              const dayEvents = (eventsByDate.get(toAwsDate(day)) ?? []).filter(
                (event) => hourOf(event.time) === hour,
              );
              return (
                <div key={day.toISOString()} className={styles.slot}>
                  {dayEvents.map((event) => (
                    <CalendarEventCard key={event.id} event={event} variant="block" />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
