import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, ProfileInput, RaIdentity, UserHandle } from "../types/forum";
import { DEFAULT_CROP } from "../utils/avatar-crop";
import { describeError } from "../utils/errors";
import { MAX_DISPLAY_NAME_LENGTH, UNKNOWN_RA_NAME } from "../utils/forum-constants";
import {
  createProfile,
  fetchHandles,
  fetchProfiles,
  subscribeToHandles,
  subscribeToProfiles,
  updateProfile,
} from "../utils/profiles-api";
import { mergeByKey } from "../utils/post-filters";
import type { ProfilesState } from "./profiles-context";

const profileKey = (profile: Profile): string => profile.userId;
const handleKey = (handle: UserHandle): string => handle.userId;

/** Compares display names the way people read them: ignoring case and repeated spaces. */
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Loads every RA profile, keeps them live through subscriptions, and saves the signed-in RA profile.
 * An RA signing in for the first time gets a profile named after their email, so every author
 * has a display name.
 */
export function useProfilesData(ra: RaIdentity): ProfilesState {
  const [profileList, setProfileList] = useState<Profile[]>([]);
  const [handleList, setHandleList] = useState<UserHandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const reportError = (cause: unknown): void => {
      if (active) setError(describeError(cause));
    };
    const stopProfiles = subscribeToProfiles(
      (profile) => setProfileList((prev) => mergeByKey(prev, [profile], profileKey)),
      reportError,
    );
    const stopHandles = subscribeToHandles(
      (handle) => setHandleList((prev) => mergeByKey(prev, [handle], handleKey)),
      reportError,
    );

    fetchHandles()
      .then((loaded) => {
        if (active) setHandleList((prev) => mergeByKey(prev, loaded, handleKey));
      })
      .catch(reportError);

    fetchProfiles()
      .then(async (loaded) => {
        if (!active) return;
        setProfileList((prev) => mergeByKey(prev, loaded, profileKey));
        setLoading(false);
        if (loaded.some((profile) => profile.userId === ra.userId)) return;
        const created = await createProfile(ra.userId, {
          displayName: ra.displayName.slice(0, MAX_DISPLAY_NAME_LENGTH),
          birthday: null,
          profilePicture: null,
          crop: DEFAULT_CROP,
        });
        if (active) setProfileList((prev) => mergeByKey(prev, [created], profileKey));
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeError(cause));
        setLoading(false);
      });

    return () => {
      active = false;
      stopProfiles();
      stopHandles();
    };
  }, [ra.userId, ra.displayName]);

  const profiles = useMemo(
    () => new Map(profileList.map((profile) => [profile.userId, profile])),
    [profileList],
  );

  const displayNameFor = useCallback(
    (userId: string, fallback: string = UNKNOWN_RA_NAME): string => profiles.get(userId)?.displayName || fallback,
    [profiles],
  );

  const handles = useMemo(
    () => new Map(handleList.map(({ userId, handle }) => [userId, handle])),
    [handleList],
  );

  const handleFor = useCallback((userId: string): string | null => handles.get(userId) ?? null, [handles]);

  const isNameTaken = useCallback(
    (displayName: string): boolean => {
      const wanted = normalizeName(displayName);
      return profileList.some(
        (profile) => profile.userId !== ra.userId && normalizeName(profile.displayName) === wanted,
      );
    },
    [profileList, ra.userId],
  );

  const saveProfile = useCallback(
    async (input: ProfileInput): Promise<void> => {
      const saved = profiles.has(ra.userId)
        ? await updateProfile(ra.userId, input)
        : await createProfile(ra.userId, input);
      setProfileList((prev) => mergeByKey(prev, [saved], profileKey));
    },
    [profiles, ra.userId],
  );

  return useMemo(
    () => ({ profiles, loading, error, displayNameFor, handleFor, isNameTaken, saveProfile }),
    [profiles, loading, error, displayNameFor, handleFor, isNameTaken, saveProfile],
  );
}
