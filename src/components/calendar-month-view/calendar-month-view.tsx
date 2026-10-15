import type { ReactElement } from "react";
import type { CalendarEntry } from "../../types/calendar";
import { buildMonthGrid, isSameDay, toAwsDate, WEEKDAY_LABELS } from "../../utils/calendar-dates";
import { cx } from "../../utils/class-names";
import { CalendarEventCard } from "../calendar-event-card/calendar-event-card";
import styles from "./calendar-month-view.module.css";

interface CalendarMonthViewProps {
  /** Any date within the month to display. */
  month: Date;
  entriesByDate: ReadonlyMap<string, CalendarEntry[]>;
}

/** Tags beyond this many on a day collapse into a "+N more" label. */
const MAX_TAGS_PER_DAY = 3;

/** Standard month grid: one row per week, each day showing a few entry tags. */
export function CalendarMonthView({ month, entriesByDate }: CalendarMonthViewProps): ReactElement {
  const days = buildMonthGrid(month);
  const today = new Date();

  return (
    <div className={styles.grid} role="grid" aria-label="Month view">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className={styles.weekday} role="columnheader">
          {label}
        </div>
      ))}
      {days.map((day) => {
        const dayEntries = entriesByDate.get(toAwsDate(day)) ?? [];
        const overflow = dayEntries.length - MAX_TAGS_PER_DAY;
        return (
          <div
            key={day.toISOString()}
            role="gridcell"
            className={cx(
              styles.day,
              day.getMonth() !== month.getMonth() && styles.outside,
              isSameDay(day, today) && styles.today,
            )}
          >
            <span className={styles.dayNumber}>{day.getDate()}</span>
            <div className={styles.tags}>
              {dayEntries.slice(0, MAX_TAGS_PER_DAY).map((entry) => (
                <CalendarEventCard key={entry.key} entry={entry} variant="tag" />
              ))}
              {overflow > 0 && <span className={styles.more}>+{overflow} more</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
