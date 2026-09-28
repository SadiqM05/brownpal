import type { ReactElement, ReactNode } from "react";
import { CalendarContext } from "../../hooks/calendar-context";
import { useCalendarData } from "../../hooks/use-calendar-data";
import { useCurrentRa } from "../../hooks/use-current-ra";

interface CalendarProviderProps {
  children: ReactNode;
}

/** Loads the shared calendar once and shares it, live, with every calendar page. */
export function CalendarProvider({ children }: CalendarProviderProps): ReactElement {
  const ra = useCurrentRa();
  const state = useCalendarData(ra);
  return <CalendarContext.Provider value={state}>{children}</CalendarContext.Provider>;
}
