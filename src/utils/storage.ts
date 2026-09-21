import { getUrl, remove, uploadData } from "aws-amplify/storage";
import "../amplify/configure";
import {
  ATTACHMENT_MIME_TYPES,
  FORUM_STORAGE_PREFIX,
  IMAGE_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_IMAGE_BYTES,
  PROFILE_STORAGE_PREFIX,
  STORAGE_URL_TTL_SECONDS,
} from "./forum-constants";

/** What kind of file a picker accepts. */
export type UploadKind = "image" | "attachment";

const BYTES_PER_MB = 1024 * 1024;
const MS_PER_SECOND = 1000;
/** Cached URLs are reused until this many seconds before they expire. */
const URL_CACHE_MARGIN_SECONDS = 60;

const urlCache = new Map<string, { promise: Promise<string>; expiresAt: number }>();

/** Returns an error message when the file is not allowed, or null when it is fine. */
export function validateFile(file: File, kind: UploadKind): string | null {
  const allowedTypes = kind === "image" ? IMAGE_MIME_TYPES : ATTACHMENT_MIME_TYPES;
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_ATTACHMENT_BYTES;
  if (!allowedTypes.includes(file.type)) {
    return kind === "image"
      ? `"${file.name}" must be a PNG, JPEG or WebP image.`
      : `"${file.name}" must be a PNG, JPEG, WebP or PDF file.`;
  }
  if (file.size > maxBytes) {
    return `"${file.name}" is larger than ${maxBytes / BYTES_PER_MB} MB.`;
  }
  return null;
}

/** Uploads a file to the signed-in RA folder under a storage prefix and returns its S3 key. */
async function uploadToPrefix(prefix: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const { path } = await uploadData({
    path: ({ identityId }) => `${prefix}/${identityId}/${crypto.randomUUID()}-${safeName}`,
    data: file,
    options: { contentType: file.type },
  }).result;
  return path;
}

/** Uploads a forum header image, attachment or flyer and returns its S3 key. */
export function uploadForumFile(file: File): Promise<string> {
  return uploadToPrefix(FORUM_STORAGE_PREFIX, file);
}

/** Uploads a profile picture and returns its S3 key. */
export function uploadProfilePicture(file: File): Promise<string> {
  return uploadToPrefix(PROFILE_STORAGE_PREFIX, file);
}

/** Deletes uploaded files by S3 key; failures are ignored because this is best-effort cleanup. */
export async function removeStoredFiles(keys: readonly string[]): Promise<void> {
  await Promise.allSettled(keys.map((path) => remove({ path })));
}

/**
 * Resolves an S3 key to a temporary URL. Keys are stored; URLs are generated only at render time.
 * URLs are cached per key so many avatars of the same RA share one request.
 */
export function resolveFileUrl(key: string): Promise<string> {
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = getUrl({ path: key, options: { expiresIn: STORAGE_URL_TTL_SECONDS } }).then(({ url }) =>
    url.toString(),
  );
  urlCache.set(key, {
    promise,
    expiresAt: Date.now() + (STORAGE_URL_TTL_SECONDS - URL_CACHE_MARGIN_SECONDS) * MS_PER_SECOND,
  });
  promise.catch(() => urlCache.delete(key));
  return promise;
}
