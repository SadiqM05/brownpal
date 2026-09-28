import { useContext } from "react";
import { CalendarContext, type CalendarState } from "./calendar-context";

/** Returns calendar events and actions. Must be used inside CalendarProvider. */
export function useCalendar(): CalendarState {
  const state = useContext(CalendarContext);
  if (!state) throw new Error("useCalendar must be used inside CalendarProvider.");
  return state;
}
