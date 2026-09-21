import type { Comment, CommentNode } from "../types/forum";

/**
 * Turns a flat comment list into a tree using parentCommentId.
 * Comments are ordered oldest first; a reply whose parent is missing is shown at the top level.
 */
export function buildCommentTree(comments: readonly Comment[]): CommentNode[] {
  const sorted = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const nodes = new Map<string, CommentNode>(
    sorted.map((comment) => [comment.id, { comment, replies: [] }]),
  );
  const roots: CommentNode[] = [];

  for (const comment of sorted) {
    const node = nodes.get(comment.id);
    if (!node) continue;
    const parent = comment.parentCommentId ? nodes.get(comment.parentCommentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Counts comments per post id. */
export function countCommentsByPost(comments: readonly Comment[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const { postId } of comments) {
    counts.set(postId, (counts.get(postId) ?? 0) + 1);
  }
  return counts;
}
