import { defineStorage } from "@aws-amplify/backend";
import { uploadGuard } from "./upload-guard/resource";

/**
 * Forum, profile-picture and calendar-event storage. Any signed-in RA can read these files;
 * only the uploading RA can write or delete inside their own folder. Every upload is checked
 * server-side by the upload-guard trigger.
 */
export const storage = defineStorage({
  name: "amplifyNotesDrive",
  triggers: {
    onUpload: uploadGuard,
  },
  access: (allow) => ({
    "forum/{entity_id}/*": [
      allow.authenticated.to(["read"]),
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
    "profile/{entity_id}/*": [
      allow.authenticated.to(["read"]),
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
    "calendar/{entity_id}/*": [
      allow.authenticated.to(["read"]),
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
});
