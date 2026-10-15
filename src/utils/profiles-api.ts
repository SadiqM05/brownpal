import { client } from "../amplify/client";
import type { Profile, ProfileInput } from "../types/forum";
import { collectPages, listen, stopAll, unwrap } from "./data-client";

/** Loads every RA profile. */
export function fetchProfiles(): Promise<Profile[]> {
  return collectPages((nextToken) => client.models.Profile.list({ nextToken }));
}

/** Creates the profile of the given RA (their first save). */
export async function createProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const result = await client.models.Profile.create({
    userId,
    displayName: input.displayName,
    birthday: input.birthday ?? undefined,
    profilePicture: input.profilePicture ?? undefined,
    avatarZoom: input.crop.zoom,
    avatarFocusX: input.crop.focusX,
    avatarFocusY: input.crop.focusY,
  });
  return unwrap(result, "The profile could not be saved.");
}

/** Updates the profile of the given RA; null clears the birthday or picture. */
export async function updateProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const result = await client.models.Profile.update({
    userId,
    displayName: input.displayName,
    birthday: input.birthday,
    profilePicture: input.profilePicture,
    avatarZoom: input.crop.zoom,
    avatarFocusX: input.crop.focusX,
    avatarFocusY: input.crop.focusY,
  });
  return unwrap(result, "The profile could not be saved.");
}

/** Subscribes to new and updated profiles. Returns a function that stops both subscriptions. */
export function subscribeToProfiles(
  onProfile: (profile: Profile) => void,
  onError: (error: unknown) => void,
): () => void {
  return stopAll(
    listen(client.models.Profile.onCreate(), onProfile, onError),
    listen(client.models.Profile.onUpdate(), onProfile, onError),
  );
}
