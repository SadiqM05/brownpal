import type { ReactElement, ReactNode } from "react";
import { ProfilesContext } from "../../hooks/profiles-context";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useProfilesData } from "../../hooks/use-profiles-data";

interface ProfilesProviderProps {
  children: ReactNode;
}

/** Loads every RA profile once and shares it, live, with the whole app. */
export function ProfilesProvider({ children }: ProfilesProviderProps): ReactElement {
  const ra = useCurrentRa();
  const state = useProfilesData(ra);
  return <ProfilesContext.Provider value={state}>{children}</ProfilesContext.Provider>;
}
