import { createContext } from "react";
import type { Profile, ProfileInput } from "../types/forum";

/** RA profiles and the action that saves the signed-in RA profile. */
export interface ProfilesState {
  /** Every profile, keyed by the RA user id. */
  profiles: ReadonlyMap<string, Profile>;
  loading: boolean;
  error: string | null;
  /** Current display name of an RA: the profile name when there is one, otherwise the fallback. */
  displayNameFor: (userId: string, fallback: string) => string;
  /** Creates or updates the signed-in RA profile. */
  saveProfile: (input: ProfileInput) => Promise<void>;
}

export const ProfilesContext = createContext<ProfilesState | null>(null);
