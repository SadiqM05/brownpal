import { useContext } from "react";
import { ProfilesContext, type ProfilesState } from "./profiles-context";

/** Returns RA profiles and the save action. Must be used inside ProfilesProvider. */
export function useProfiles(): ProfilesState {
  const state = useContext(ProfilesContext);
  if (!state) throw new Error("useProfiles must be used inside ProfilesProvider.");
  return state;
}
