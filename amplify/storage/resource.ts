import { defineStorage } from "@aws-amplify/backend";

/**
 * Forum and profile-picture storage. Any signed-in RA can read these files;
 * only the uploading RA can write or delete inside their own folder.
 */
export const storage = defineStorage({
  name: "amplifyNotesDrive",
  access: (allow) => ({
    "forum/{entity_id}/*": [
      allow.authenticated.to(["read"]),
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
    "profile/{entity_id}/*": [
      allow.authenticated.to(["read"]),
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
});
