import { client } from "../amplify/client";
import type { Comment, NewCommentInput, NewPostInput, Post, PostRead } from "../types/forum";
import { assertNoErrors, collectPages, listen, stopAll, unwrap } from "./data-client";
import { termOf } from "./terms";

/** Loads the posts written in one academic term. */
export function fetchPostsByTerm(term: string): Promise<Post[]> {
  return collectPages((nextToken) => client.models.Post.listPostsByTerm({ term }, { nextToken }));
}

/** Loads the comments written in one academic term. */
export function fetchCommentsByTerm(term: string): Promise<Comment[]> {
  return collectPages((nextToken) => client.models.Comment.listCommentsByTerm({ term }, { nextToken }));
}

/** Loads one post, or null when it does not exist. */
export async function fetchPost(postId: string): Promise<Post | null> {
  const { data, errors } = await client.models.Post.get({ id: postId });
  assertNoErrors(errors);
  return data;
}

/** Loads every comment on one post. */
export function fetchCommentsByPost(postId: string): Promise<Comment[]> {
  return collectPages((nextToken) => client.models.Comment.listCommentsByPost({ postId }, { nextToken }));
}

/** Loads the read receipts of the signed-in RA (PostRead is private to its owner). */
export function fetchOwnReads(): Promise<PostRead[]> {
  return collectPages((nextToken) => client.models.PostRead.list({ nextToken }));
}

/** Creates a post in the current term. The backend records the signed-in RA as its owner. */
export async function createForumPost(input: NewPostInput): Promise<Post> {
  const result = await client.models.Post.create({ ...input, term: termOf(new Date()), pinned: false });
  return unwrap(result, "The post could not be created.");
}

/**
 * Replaces a post's content with the edited values and stamps editedAt. Optional fields left
 * out of the input are cleared. The backend only allows the post author to do this.
 */
export async function updateForumPost(postId: string, input: NewPostInput): Promise<Post> {
  const result = await client.models.Post.update({
    id: postId,
    category: input.category,
    title: input.title,
    content: input.content,
    headerImage: input.headerImage ?? null,
    attachments: input.attachments,
    flyer: input.flyer ?? null,
    eventDate: input.eventDate ?? null,
    eventTime: input.eventTime ?? null,
    location: input.location ?? null,
    editedAt: new Date().toISOString(),
  });
  return unwrap(result, "The post could not be saved.");
}

/** Pins or unpins a post. The backend only allows the post author to do this. */
export async function updatePostPinned(postId: string, pinned: boolean): Promise<Post> {
  const result = await client.models.Post.update({ id: postId, pinned });
  return unwrap(result, "The post could not be updated.");
}

/** Deletes a post. The backend only allows the post author to do this. */
export async function deleteForumPost(postId: string): Promise<void> {
  const { errors } = await client.models.Post.delete({ id: postId });
  assertNoErrors(errors);
}

/** Creates a comment or a reply. The backend records the signed-in RA as its owner. */
export async function createForumComment(input: NewCommentInput): Promise<Comment> {
  const result = await client.models.Comment.create(input);
  return unwrap(result, "The comment could not be posted.");
}

/** Replaces a comment's text and stamps editedAt. The backend only allows the comment author to do this. */
export async function updateForumComment(commentId: string, content: string): Promise<Comment> {
  const result = await client.models.Comment.update({
    id: commentId,
    content,
    editedAt: new Date().toISOString(),
  });
  return unwrap(result, "The comment could not be saved.");
}

/** Blanks a comment and flags it deleted, keeping the row so its replies stay in place. */
export async function softDeleteForumComment(commentId: string): Promise<Comment> {
  const result = await client.models.Comment.update({ id: commentId, content: "", deleted: true });
  return unwrap(result, "The comment could not be deleted.");
}

/** Deletes a comment. The backend only allows the comment author to do this. */
export async function deleteForumComment(commentId: string): Promise<void> {
  const { errors } = await client.models.Comment.delete({ id: commentId });
  assertNoErrors(errors);
}

/** Records that the RA has opened a post. */
export async function createPostRead(userId: string, postId: string): Promise<void> {
  const { errors } = await client.models.PostRead.create({ postId, userId });
  assertNoErrors(errors);
}

/** Subscribes to created, updated and deleted posts. Returns a function that stops every subscription. */
export function subscribeToPosts(
  onUpsert: (post: Post) => void,
  onDelete: (post: Post) => void,
  onError: (error: unknown) => void,
): () => void {
  return stopAll(
    listen(client.models.Post.onCreate(), onUpsert, onError),
    listen(client.models.Post.onUpdate(), onUpsert, onError),
    listen(client.models.Post.onDelete(), onDelete, onError),
  );
}

/** Subscribes to created, updated and deleted comments. Returns a function that stops every subscription. */
export function subscribeToComments(
  onUpsert: (comment: Comment) => void,
  onDelete: (comment: Comment) => void,
  onError: (error: unknown) => void,
): () => void {
  return stopAll(
    listen(client.models.Comment.onCreate(), onUpsert, onError),
    listen(client.models.Comment.onUpdate(), onUpsert, onError),
    listen(client.models.Comment.onDelete(), onDelete, onError),
  );
}
