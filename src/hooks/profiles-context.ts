import { createContext } from "react";
import type { Profile, ProfileInput } from "../types/forum";

/** RA profiles and the action that saves the signed-in RA profile. */
export interface ProfilesState {
  /** Every profile, keyed by the RA user id. */
  profiles: ReadonlyMap<string, Profile>;
  loading: boolean;
  error: string | null;
  /** Current display name of an RA: the profile name when there is one, otherwise the fallback ("RA" by default). */
  displayNameFor: (userId: string, fallback?: string) => string;
  /**
   * Verified email handle of an RA (such as "amoham26"), or null when not known yet. Shown beside
   * display names, which RAs choose freely, so nobody can pass as someone else.
   */
  handleFor: (userId: string) => string | null;
  /** True when another RA already uses this display name (ignoring case and spacing). */
  isNameTaken: (displayName: string) => boolean;
  /** Creates or updates the signed-in RA profile. */
  saveProfile: (input: ProfileInput) => Promise<void>;
}

export const ProfilesContext = createContext<ProfilesState | null>(null);
