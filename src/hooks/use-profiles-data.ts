import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, ProfileInput, RaIdentity } from "../types/forum";
import { describeError } from "../utils/errors";
import { createProfile, fetchProfiles, subscribeToProfiles, updateProfile } from "../utils/forum-api";
import { mergeByKey } from "../utils/post-filters";
import type { ProfilesState } from "./profiles-context";

const profileKey = (profile: Profile): string => profile.userId;

/** Loads every RA profile, keeps them live through subscriptions, and saves the signed-in RA profile. */
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
      .then((loaded) => {
        if (!active) return;
        setProfileList((prev) => mergeByKey(prev, loaded, profileKey));
        setLoading(false);
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
  }, []);

  const profiles = useMemo(
    () => new Map(profileList.map((profile) => [profile.userId, profile])),
    [profileList],
  );

  const displayNameFor = useCallback(
    (userId: string, fallback: string): string => profiles.get(userId)?.displayName || fallback,
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
