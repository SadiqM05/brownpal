import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useForum } from "../../hooks/use-forum";
import { useStorageUrl } from "../../hooks/use-storage-url";
import shared from "../../styles/shared.module.css";
import type { Post } from "../../types/forum";
import { describeError } from "../../utils/errors";
import { CATEGORY_EVENTS, CATEGORY_OPTIONS } from "../../utils/forum-constants";
import { formatRelativeTime } from "../../utils/format";
import { AuthorLink } from "../author-link/author-link";
import { CommentThread } from "../comment-thread/comment-thread";
import { EventDetailsCard } from "../event-details-card/event-details-card";
import { FileLink } from "../file-link/file-link";
import styles from "./post-detail.module.css";

interface PostDetailProps {
  post: Post;
}

/** Full post: header image, metadata, event details, content, attachments and comments. */
export function PostDetail({ post }: PostDetailProps): ReactElement {
  const ra = useCurrentRa();
  const { comments, loading, markAsRead, setPinned } = useForum();
  const headerUrl = useStorageUrl(post.headerImage);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinning, setPinning] = useState(false);

  const isAuthor = post.authorId === ra.userId;
  const isEvent = post.category === CATEGORY_EVENTS;
  const categoryLabel = CATEGORY_OPTIONS.find(({ value }) => value === post.category)?.label ?? post.category;
  const attachments = (post.attachments ?? []).filter((key): key is string => key !== null);
  const postComments = useMemo(
    () => comments.filter((comment) => comment.postId === post.id),
    [comments, post.id],
  );

  // Opening a post marks it as read; wait for the initial load so existing read receipts are known.
  useEffect(() => {
    if (!loading) void markAsRead(post.id);
  }, [loading, markAsRead, post.id]);

  async function togglePinned(): Promise<void> {
    setPinning(true);
    setPinError(null);
    try {
      await setPinned(post.id, !post.pinned);
    } catch (cause) {
      setPinError(describeError(cause));
    } finally {
      setPinning(false);
    }
  }

  return (
    <article className={styles.post}>
      {headerUrl && <img className={styles.header} src={headerUrl} alt="" />}
      <header className={styles.top}>
        <div className={styles.badges}>
          <span className={shared.badge}>{categoryLabel}</span>
          {post.pinned && <span className={shared.badge}>Pinned</span>}
        </div>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.meta}>
          <AuthorLink userId={post.authorId} fallbackName={post.authorName} avatarSize="md" />
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
        </p>
        {isAuthor && (
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            aria-pressed={post.pinned}
            onClick={() => void togglePinned()}
            disabled={pinning}
          >
            {post.pinned ? "Unpin post" : "Pin post"}
          </button>
        )}
        {pinError && (
          <p className={shared.alert} role="alert">
            {pinError}
          </p>
        )}
      </header>

      {isEvent && (
        <EventDetailsCard
          eventDate={post.eventDate}
          eventTime={post.eventTime}
          location={post.location}
          flyer={post.flyer}
        />
      )}

      <p className={styles.content}>{post.content}</p>

      {attachments.length > 0 && (
        <section aria-labelledby={`attachments-${post.id}`} className={styles.attachments}>
          <h2 id={`attachments-${post.id}`} className={styles.subheading}>
            Attachments
          </h2>
          <ul className={styles.attachmentList}>
            {attachments.map((key) => (
              <li key={key}>
                <FileLink storageKey={key} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <CommentThread postId={post.id} comments={postComments} />
    </article>
  );
}
