import { useMemo, type ReactElement } from "react";
import { useForum } from "../../hooks/use-forum";
import type { Comment } from "../../types/forum";
import { buildCommentTree } from "../../utils/comment-tree";
import { CommentItem } from "../comment/comment";
import { ReplyForm } from "../reply-form/reply-form";
import styles from "./comment-thread.module.css";

interface CommentThreadProps {
  postId: string;
  /** The post's academic term, which its comments take. */
  term: string;
  /** Every comment on the post, replies included, in any order. */
  comments: Comment[];
}

/** Threaded discussion for a post: a box for new comments and the nested replies. */
export function CommentThread({ postId, term, comments }: CommentThreadProps): ReactElement {
  const { addComment } = useForum();
  const tree = useMemo(() => buildCommentTree(comments), [comments]);
  const visibleCount = comments.filter((comment) => !comment.deleted).length;

  return (
    <section className={styles.thread} aria-labelledby={`comments-${postId}`}>
      <h2 id={`comments-${postId}`} className={styles.heading}>
        Comments ({visibleCount})
      </h2>
      <ReplyForm
        label="Write a comment"
        submitLabel="Post comment"
        onSubmit={(content) => addComment({ postId, term, content })}
      />
      {tree.length === 0 ? (
        <p className={styles.empty}>No comments yet. Start the conversation.</p>
      ) : (
        <ul className={styles.list}>
          {tree.map((node) => (
            <CommentItem key={node.comment.id} node={node} depth={0} />
          ))}
        </ul>
      )}
    </section>
  );
}
