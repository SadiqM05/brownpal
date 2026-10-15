import { type AttributeValue, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

/**
 * Server-side clean-up the RA's own client is not allowed to do, because comments and read
 * receipts belong to whoever wrote them:
 * - A deleted post takes its comments, read receipts and uploaded files with it.
 * - A deleted comment whose parent is a "deleted comment" placeholder with no replies left
 *   removes that placeholder too. That removal is itself a stream event, so this walks up the thread.
 * Rows deleted here bypass AppSync, so open clients are not notified; they already drop a post's
 * comments when the post's own delete arrives.
 */

/** Matches the Comment index name in amplify/data/resource.ts. */
const COMMENTS_BY_POST_INDEX = 'commentsByPost';
/** BatchWriteItem accepts at most this many requests per call. */
const BATCH_SIZE = 25;

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

  const fileKeys = postFileKeys(post);
  if (fileKeys.length > 0) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: fileKeys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
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

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    const oldImage = record.dynamodb?.OldImage;
    if (record.eventName !== 'REMOVE' || !oldImage) continue;
    const item = unmarshall(oldImage as Record<string, AttributeValue>);
    if (isFromTable(record, POST_TABLE)) await cleanUpPost(item);
    else if (isFromTable(record, COMMENT_TABLE)) await cleanUpParentPlaceholder(item);
  }
};
