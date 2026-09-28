import { useMemo, useState, type ReactElement } from "react";
import { CalendarEventModal } from "../components/calendar-event-modal/calendar-event-modal";
import { CalendarMonthView } from "../components/calendar-month-view/calendar-month-view";
import { CalendarWeekView } from "../components/calendar-week-view/calendar-week-view";
import { useCalendar } from "../hooks/use-calendar";
import shared from "../styles/shared.module.css";
import type { CalendarViewMode } from "../types/calendar";
import { addDays, groupEventsByDate, startOfWeek } from "../utils/calendar-dates";
import { cx } from "../utils/class-names";
import styles from "./calendar-page.module.css";
import pageStyles from "./page.module.css";

const VIEW_OPTIONS: ReadonlyArray<{ value: CalendarViewMode; label: string }> = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
];

/** Shared staff calendar: Month/Week tabs, navigation, and the Add Event button. */
export function CalendarPage(): ReactElement {
  const { events, loading, error } = useCalendar();
  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [creating, setCreating] = useState(false);

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const heading =
    view === "month"
      ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(
          undefined,
          { month: "short", day: "numeric", year: "numeric" },
        )}`;

  function step(direction: 1 | -1): void {
    setAnchor((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(next.getMonth() + direction);
      else next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.titleRow}>
        <div>
          <h1 className={pageStyles.title}>Shared Calendar</h1>
          <p className={styles.subheading}>Shared operations calendar for Brown Hall Staff</p>
        </div>
        <button type="button" className={`${shared.button} ${shared.primary}`} onClick={() => setCreating(true)}>
          Add event
        </button>
      </div>

      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}

      <div className={styles.toolbar}>
        <div className={styles.viewTabs} role="group" aria-label="Calendar view">
          {VIEW_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={cx(styles.viewTab, value === view && styles.viewTabActive)}
              aria-pressed={value === view}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.nav}>
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={() => step(-1)}
            aria-label={view === "month" ? "Previous month" : "Previous week"}
          >
            ‹
          </button>
          <span className={styles.heading}>{heading}</span>
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={() => step(1)}
            aria-label={view === "month" ? "Next month" : "Next week"}
          >
            ›
          </button>
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={() => setAnchor(new Date())}
          >
            Today
          </button>
        </div>
      </div>

      {loading ? (
        <p className={pageStyles.status} role="status">
          Loading calendar…
        </p>
      ) : view === "month" ? (
        <CalendarMonthView month={anchor} eventsByDate={eventsByDate} />
      ) : (
        <CalendarWeekView weekStart={weekStart} eventsByDate={eventsByDate} />
      )}

      {creating && <CalendarEventModal onClose={() => setCreating(false)} onSaved={() => setCreating(false)} />}
    </div>
  );
}
