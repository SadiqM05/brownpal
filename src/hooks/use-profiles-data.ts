import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, ProfileInput, RaIdentity } from "../types/forum";
import { DEFAULT_CROP } from "../utils/avatar-crop";
import { describeError } from "../utils/errors";
import { MAX_DISPLAY_NAME_LENGTH, UNKNOWN_RA_NAME } from "../utils/forum-constants";
import { createProfile, fetchProfiles, subscribeToProfiles, updateProfile } from "../utils/profiles-api";
import { mergeByKey } from "../utils/post-filters";
import type { ProfilesState } from "./profiles-context";

const profileKey = (profile: Profile): string => profile.userId;

/**
 * Loads every RA profile, keeps them live through subscriptions, and saves the signed-in RA profile.
 * An RA signing in for the first time gets a profile named after their email, so every author
 * has a display name.
 */
export function useProfilesData(ra: RaIdentity): ProfilesState {
  const [profileList, setProfileList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const stop = subscribeToProfiles(
      (profile) => setProfileList((prev) => mergeByKey(prev, [profile], profileKey)),
      (cause) => {
        if (active) setError(describeError(cause));
      },
    );

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
      stop();
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
    () => ({ profiles, loading, error, displayNameFor, saveProfile }),
    [profiles, loading, error, displayNameFor, saveProfile],
  );
}
