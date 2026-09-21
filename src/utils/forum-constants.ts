import type { Category, PostTab } from "../types/forum";

export const CATEGORY_EVENTS: Category = "PROGRAMS_EVENTS";

export const CATEGORY_OPTIONS: ReadonlyArray<{ value: Category; label: string }> = [
  { value: "BUILDING_UPDATES", label: "Building Updates" },
  { value: "PROGRAMS_EVENTS", label: "Programs & Events" },
  { value: "RA_QUESTIONS", label: "RA Questions" },
  { value: "GENERAL_ANNOUNCEMENTS", label: "General Announcements" },
  { value: "LOST_AND_FOUND", label: "Lost & Found" },
];

export const TAB_OPTIONS: ReadonlyArray<{ value: PostTab; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "unread", label: "Unread" },
  { value: "seen", label: "Seen" },
  { value: "pinned", label: "Pinned" },
];

export const ROUTES = {
  forum: "/",
  newPost: "/post/new",
  post: (postId: string): string => `/post/${postId}`,
  editProfile: "/profile",
  profile: (userId: string): string => `/profile/${userId}`,
} as const;

export const FORUM_STORAGE_PREFIX = "forum";
export const PROFILE_STORAGE_PREFIX = "profile";

export const MIN_DISPLAY_NAME_LENGTH = 2;
export const MAX_DISPLAY_NAME_LENGTH = 30;

export const MAX_TITLE_LENGTH = 120;
export const MAX_CONTENT_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_LOCATION_LENGTH = 120;
export const MAX_ATTACHMENTS = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const STORAGE_URL_TTL_SECONDS = 3600;
export const EXCERPT_LENGTH = 160;
/** Replies nest visually up to this depth; deeper replies stay at the same indent. */
export const MAX_VISUAL_DEPTH = 5;

export const IMAGE_MIME_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp"];
export const ATTACHMENT_MIME_TYPES: readonly string[] = [...IMAGE_MIME_TYPES, "application/pdf"];
