import { useState, type ReactElement } from "react";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useForum } from "../../hooks/use-forum";
import { useProfiles } from "../../hooks/use-profiles";
import shared from "../../styles/shared.module.css";
import type { CommentNode } from "../../types/forum";
import { cx } from "../../utils/class-names";
import { describeError } from "../../utils/errors";
import { MAX_VISUAL_DEPTH } from "../../utils/forum-constants";
import { formatRelativeTime } from "../../utils/format";
import { authorIdOf } from "../../utils/ownership";
import { AuthorLink } from "../author-link/author-link";
import { ConfirmDialog } from "../confirm-dialog/confirm-dialog";
import { ReplyForm } from "../reply-form/reply-form";
import styles from "./comment.module.css";

interface CommentItemProps {
  node: CommentNode;
  /** 0 for a top-level comment, 1 for a reply to it, and so on. */
  depth: number;
}

/** What the comment box is showing below the text. */
type Mode = "idle" | "replying" | "editing";

/**
 * One comment with its reply box and, recursively, all of its replies. Its author can edit or
 * delete it; a deleted comment that still has replies stays as a placeholder.
 */
export function CommentItem({ node, depth }: CommentItemProps): ReactElement {
  const { comment, replies } = node;
  const ra = useCurrentRa();
  const { addComment, editComment, deleteComment } = useForum();
  const { displayNameFor } = useProfiles();
  const [mode, setMode] = useState<Mode>("idle");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const authorId = authorIdOf(comment);
  const authorName = displayNameFor(authorId);
  const isAuthor = authorId === ra.userId;
  const hasReplies = replies.length > 0;

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteComment(comment, hasReplies);
      setDeleteOpen(false);
    } catch (cause) {
      setDeleteError(describeError(cause));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className={styles.item}>
      {comment.deleted ? (
        <p className={cx(styles.comment, styles.deleted)}>This comment was deleted.</p>
      ) : (
        <article className={styles.comment}>
          <header className={styles.meta}>
            <AuthorLink userId={authorId} />
            <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
            {comment.editedAt && <span title={new Date(comment.editedAt).toLocaleString()}>(edited)</span>}
          </header>

          {mode === "editing" ? (
            <ReplyForm
              label="Edit your comment"
              submitLabel="Save"
              pendingLabel="Saving…"
              initialContent={comment.content}
              autoFocus
              onSubmit={(content) => editComment(comment.id, content)}
              onDone={() => setMode("idle")}
              onCancel={() => setMode("idle")}
            />
          ) : (
            <p className={styles.content}>{comment.content}</p>
          )}

          {mode === "replying" && (
            <ReplyForm
              label={`Reply to ${authorName}`}
              submitLabel="Reply"
              autoFocus
              onSubmit={(content) => addComment({ postId: comment.postId, term: comment.term, parentCommentId: comment.id, content })}
              onDone={() => setMode("idle")}
              onCancel={() => setMode("idle")}
            />
          )}

          {mode === "idle" && (
            <div className={styles.actions}>
              <button
                type="button"
                className={`${shared.button} ${shared.secondary} ${shared.small}`}
                onClick={() => setMode("replying")}
                aria-label={`Reply to ${authorName}`}
              >
                Reply
              </button>
              {isAuthor && (
                <>
                  <button
                    type="button"
                    className={`${shared.button} ${shared.secondary} ${shared.small}`}
                    onClick={() => setMode("editing")}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${shared.button} ${shared.secondary} ${shared.small}`}
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </article>
      )}

      {hasReplies && (
        <ul className={cx(styles.replies, depth + 1 >= MAX_VISUAL_DEPTH && styles.flat)}>
          {replies.map((reply) => (
            <CommentItem key={reply.comment.id} node={reply} depth={depth + 1} />
          ))}
        </ul>
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete this comment?"
          message={
            hasReplies
              ? "Your comment will be removed. Replies to it will stay, under a “deleted comment” placeholder."
              : "Your comment will be removed for everyone. This cannot be undone."
          }
          confirmLabel="Delete comment"
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            setDeleteOpen(false);
            setDeleteError(null);
          }}
          confirming={deleting}
          error={deleteError}
        />
      )}
    </li>
  );
}
