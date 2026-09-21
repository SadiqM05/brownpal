import { useState, type ReactElement } from "react";
import { useProfiles } from "../../hooks/use-profiles";
import shared from "../../styles/shared.module.css";
import type { CommentNode } from "../../types/forum";
import { cx } from "../../utils/class-names";
import { MAX_VISUAL_DEPTH } from "../../utils/forum-constants";
import { formatRelativeTime } from "../../utils/format";
import { AuthorLink } from "../author-link/author-link";
import { ReplyForm } from "../reply-form/reply-form";
import styles from "./comment.module.css";

interface CommentItemProps {
  node: CommentNode;
  /** 0 for a top-level comment, 1 for a reply to it, and so on. */
  depth: number;
}

/** One comment with its reply box and, recursively, all of its replies. */
export function CommentItem({ node, depth }: CommentItemProps): ReactElement {
  const { comment, replies } = node;
  const { displayNameFor } = useProfiles();
  const [replying, setReplying] = useState(false);
  const authorName = displayNameFor(comment.authorId, comment.authorName);

  return (
    <li className={styles.item}>
      <article className={styles.comment}>
        <header className={styles.meta}>
          <AuthorLink userId={comment.authorId} fallbackName={comment.authorName} />
          <time dateTime={comment.createdAt}>{formatRelativeTime(comment.createdAt)}</time>
        </header>
        <p className={styles.content}>{comment.content}</p>
        {replying ? (
          <ReplyForm
            postId={comment.postId}
            parentCommentId={comment.id}
            label={`Reply to ${authorName}`}
            submitLabel="Reply"
            autoFocus
            onDone={() => setReplying(false)}
          />
        ) : (
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={() => setReplying(true)}
            aria-label={`Reply to ${authorName}`}
          >
            Reply
          </button>
        )}
      </article>
      {replies.length > 0 && (
        <ul className={cx(styles.replies, depth + 1 >= MAX_VISUAL_DEPTH && styles.flat)}>
          {replies.map((reply) => (
            <CommentItem key={reply.comment.id} node={reply} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
