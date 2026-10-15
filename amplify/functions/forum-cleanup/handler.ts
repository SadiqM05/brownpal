import { type AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  type QueryCommandInput,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import { FORUM_STORAGE_PREFIX } from '../../../src/utils/forum-constants';
import { termOf } from '../../../src/utils/terms';

/**
 * Server-side upkeep the RA's own client is not allowed, or not trusted, to do:
 * - A deleted post takes its comments, read receipts and uploaded files with it. A file is only
 *   deleted when no other post still uses it, so a post that points at someone else's files can't
 *   be used to delete them.
 * - A deleted comment whose parent is a "deleted comment" placeholder with no replies left
 *   removes that placeholder too. That removal is itself a stream event, so this walks up the thread.
 * - A new comment must belong to a real post, and a reply to a comment on that same post; one
 *   that doesn't is deleted. Its term is corrected to its post's term.
 * - A new post's term must match the date it was written (within a day, to allow for time zones).
 * Changes made here bypass AppSync, so open clients see them after their next load.
 */

/** Matches the Comment index name in amplify/data/resource.ts. */
const COMMENTS_BY_POST_INDEX = 'commentsByPost';
/** BatchWriteItem accepts at most this many requests per call. */
const BATCH_SIZE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}.`);
  return value;
}

const POST_TABLE = requireEnv('POST_TABLE_NAME');
const COMMENT_TABLE = requireEnv('COMMENT_TABLE_NAME');
const POST_READ_TABLE = requireEnv('POST_READ_TABLE_NAME');
const BUCKET = requireEnv('BUCKET_NAME');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

type Item = Record<string, unknown>;

/** True when a stream record came from the given table. */
function isFromTable(record: DynamoDBRecord, tableName: string): boolean {
  return record.eventSourceARN?.includes(`:table/${tableName}/`) ?? false;
}

/** Reads every page of a query. */
async function queryAll(input: QueryCommandInput): Promise<Item[]> {
  const items: Item[] = [];
  let startKey: Item | undefined;
  do {
    const page = await db.send(new QueryCommand({ ...input, ExclusiveStartKey: startKey }));
    items.push(...(page.Items ?? []));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return items;
}

/** Deletes rows by key, 25 at a time, retrying anything DynamoDB leaves unprocessed. */
async function deleteKeys(tableName: string, keys: readonly Item[]): Promise<void> {
  for (let start = 0; start < keys.length; start += BATCH_SIZE) {
    let requests = keys.slice(start, start + BATCH_SIZE).map((Key) => ({ DeleteRequest: { Key } }));
    while (requests.length > 0) {
      const result = await db.send(new BatchWriteCommand({ RequestItems: { [tableName]: requests } }));
      requests = (result.UnprocessedItems?.[tableName] ?? []) as typeof requests;
    }
  }
}

/** Every stored file a post references. */
function postFileKeys(post: Item): string[] {
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  return [post.headerImage, post.flyer, ...attachments].filter(
    (key): key is string => typeof key === 'string' && key.length > 0,
  );
}

/** Every file key still referenced by any post. Fine at one building's scale; revisit if posts reach the tens of thousands. */
async function referencedFileKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  let startKey: Item | undefined;
  do {
    const page = await db.send(
      new ScanCommand({
        TableName: POST_TABLE,
        ProjectionExpression: 'headerImage, flyer, attachments',
        ExclusiveStartKey: startKey,
      }),
    );
    for (const post of page.Items ?? []) postFileKeys(post).forEach((key) => keys.add(key));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return keys;
}

async function cleanUpPost(post: Item): Promise<void> {
  const postId = post.id as string;
  const [comments, reads] = await Promise.all([
    queryAll({
      TableName: COMMENT_TABLE,
      IndexName: COMMENTS_BY_POST_INDEX,
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      ProjectionExpression: 'id',
    }),
    queryAll({
      TableName: POST_READ_TABLE,
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      ProjectionExpression: 'postId, userId',
    }),
  ]);

  await deleteKeys(COMMENT_TABLE, comments.map(({ id }) => ({ id })));
  await deleteKeys(POST_READ_TABLE, reads.map(({ postId: readPostId, userId }) => ({ postId: readPostId, userId })));

  const candidates = postFileKeys(post).filter((key) => key.startsWith(`${FORUM_STORAGE_PREFIX}/`));
  if (candidates.length === 0) return;
  const stillUsed = await referencedFileKeys();
  const fileKeys = candidates.filter((key) => !stillUsed.has(key));
  if (fileKeys.length === 0) return;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: fileKeys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}

async function cleanUpParentPlaceholder(comment: Item): Promise<void> {
  const parentId = comment.parentCommentId;
  if (typeof parentId !== 'string') return;

  const { Item: parent } = await db.send(new GetCommand({ TableName: COMMENT_TABLE, Key: { id: parentId } }));
  if (!parent?.deleted) return;

  const remainingReplies = await queryAll({
    TableName: COMMENT_TABLE,
    IndexName: COMMENTS_BY_POST_INDEX,
    KeyConditionExpression: 'postId = :postId',
    FilterExpression: 'parentCommentId = :parentId',
    ExpressionAttributeValues: { ':postId': parent.postId, ':parentId': parentId },
    ProjectionExpression: 'id',
  });
  if (remainingReplies.length > 0) return;

  try {
    await db.send(
      new DeleteCommand({
        TableName: COMMENT_TABLE,
        Key: { id: parentId },
        ConditionExpression: 'deleted = :true',
        ExpressionAttributeValues: { ':true': true },
      }),
    );
  } catch (error) {
    // Already gone (for example, removed with its post). Nothing left to do.
    if ((error as { name?: string }).name !== 'ConditionalCheckFailedException') throw error;
  }
}

/** Updates one attribute if the row still exists. */
async function setAttribute(tableName: string, id: unknown, name: string, value: unknown): Promise<void> {
  try {
    await db.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: 'SET #name = :value',
        ConditionExpression: 'attribute_exists(id)',
        ExpressionAttributeNames: { '#name': name },
        ExpressionAttributeValues: { ':value': value },
      }),
    );
  } catch (error) {
    if ((error as { name?: string }).name !== 'ConditionalCheckFailedException') throw error;
  }
}

async function validateNewComment(comment: Item): Promise<void> {
  const { Item: post } = await db.send(new GetCommand({ TableName: POST_TABLE, Key: { id: comment.postId } }));
  let valid = Boolean(post);
  if (valid && typeof comment.parentCommentId === 'string') {
    const { Item: parent } = await db.send(
      new GetCommand({ TableName: COMMENT_TABLE, Key: { id: comment.parentCommentId } }),
    );
    // A missing parent may simply have been deleted meanwhile; a parent on another post is never valid.
    valid = !parent || parent.postId === comment.postId;
  }

  if (!valid) {
    await db.send(new DeleteCommand({ TableName: COMMENT_TABLE, Key: { id: comment.id } }));
  } else if (post && comment.term !== post.term) {
    await setAttribute(COMMENT_TABLE, comment.id, 'term', post.term);
  }
}

async function validateNewPost(post: Item): Promise<void> {
  const created = new Date(String(post.createdAt));
  if (Number.isNaN(created.getTime())) return;
  const allowed = [-DAY_MS, 0, DAY_MS].map((offset) => termOf(new Date(created.getTime() + offset)));
  if (!allowed.includes(String(post.term))) await setAttribute(POST_TABLE, post.id, 'term', termOf(created));
}

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    const image = record.eventName === 'REMOVE' ? record.dynamodb?.OldImage : record.dynamodb?.NewImage;
    if (!image) continue;
    const item = unmarshall(image as Record<string, AttributeValue>);
    const fromPosts = isFromTable(record, POST_TABLE);
    const fromComments = isFromTable(record, COMMENT_TABLE);

    if (record.eventName === 'REMOVE') {
      if (fromPosts) await cleanUpPost(item);
      else if (fromComments) await cleanUpParentPlaceholder(item);
    } else if (record.eventName === 'INSERT') {
      if (fromPosts) await validateNewPost(item);
      else if (fromComments) await validateNewComment(item);
    }
  }
};
