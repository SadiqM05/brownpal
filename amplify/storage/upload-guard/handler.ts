import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { S3Handler } from 'aws-lambda';
import {
  ATTACHMENT_MIME_TYPES,
  CALENDAR_STORAGE_PREFIX,
  FORUM_STORAGE_PREFIX,
  IMAGE_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_IMAGE_BYTES,
  PROFILE_STORAGE_PREFIX,
} from '../../../src/utils/forum-constants';

/**
 * Enforces the upload rules the browser only checks politely: allowed file types and sizes per
 * folder. The file's first bytes must match its declared type, so a script can't be uploaded as
 * an "image" and served with a type a browser would run. Files that break a rule are deleted.
 */

const s3 = new S3Client({});

/** Bytes needed to recognise every allowed format. */
const SIGNATURE_BYTES = 12;

/** Allowed types and size limit for each storage folder. */
const RULES: ReadonlyArray<{ prefix: string; types: readonly string[]; maxBytes: number }> = [
  { prefix: `${PROFILE_STORAGE_PREFIX}/`, types: IMAGE_MIME_TYPES, maxBytes: MAX_IMAGE_BYTES },
  { prefix: `${FORUM_STORAGE_PREFIX}/`, types: ATTACHMENT_MIME_TYPES, maxBytes: MAX_ATTACHMENT_BYTES },
  { prefix: `${CALENDAR_STORAGE_PREFIX}/`, types: ATTACHMENT_MIME_TYPES, maxBytes: MAX_ATTACHMENT_BYTES },
];

/** The real type of a file from its first bytes, or null when it is none of the allowed formats. */
function detectType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number): string => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

/** Why the file is not allowed, or null when it is fine. */
async function findProblem(bucket: string, key: string, size: number): Promise<string | null> {
  const rule = RULES.find(({ prefix }) => key.startsWith(prefix));
  if (!rule) return 'outside the allowed folders';
  if (size > rule.maxBytes) return `larger than ${rule.maxBytes} bytes`;

  const object = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${SIGNATURE_BYTES - 1}` }),
  );
  const bytes = (await object.Body?.transformToByteArray()) ?? new Uint8Array();
  const actualType = detectType(bytes);
  if (!actualType || !rule.types.includes(actualType)) return 'not an allowed file type';
  if (object.ContentType !== actualType) return `declared as ${object.ContentType} but is ${actualType}`;
  return null;
}

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    // Keys arrive URL-encoded, with spaces as "+".
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const problem = await findProblem(bucket, key, record.s3.object.size);
    if (problem) {
      console.warn(`Deleting ${key}: ${problem}.`);
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  }
};
