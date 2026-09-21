import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useStorageUrl } from "../../hooks/use-storage-url";
import shared from "../../styles/shared.module.css";
import type { Post } from "../../types/forum";
import { cx } from "../../utils/class-names";
import { CATEGORY_EVENTS, CATEGORY_OPTIONS, ROUTES } from "../../utils/forum-constants";
import { formatEventDate, formatEventTime, formatRelativeTime, toExcerpt } from "../../utils/format";
import { AuthorLink } from "../author-link/author-link";
import styles from "./post-card.module.css";

interface PostCardProps {
  post: Post;
  commentCount: number;
  isRead: boolean;
}

/** Feed card for one post: category badge, optional header image, excerpt and metadata. */
export function PostCard({ post, commentCount, isRead }: PostCardProps): ReactElement {
  const imageUrl = useStorageUrl(post.headerImage);
  const isEvent = post.category === CATEGORY_EVENTS;
  const categoryLabel = CATEGORY_OPTIONS.find(({ value }) => value === post.category)?.label ?? post.category;
  const eventLine = [
    post.eventDate ? formatEventDate(post.eventDate) : null,
    post.eventTime ? formatEventTime(post.eventTime) : null,
    post.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={cx(styles.card, !isRead && styles.unread)}>
      {isEvent && (
        <div className={styles.circle} aria-hidden="true">
          {imageUrl ? <img className={styles.circleImage} src={imageUrl} alt="" /> : <span>📅</span>}
        </div>
      )}
      <div className={styles.body}>
        <div className={styles.badges}>
          <span className={shared.badge}>{categoryLabel}</span>
          {post.pinned && <span className={cx(shared.badge, styles.pinned)}>Pinned</span>}
          {!isRead && <span className={cx(shared.badge, styles.new)}>New</span>}
        </div>
        <h3 className={styles.title}>
          <Link className={styles.link} to={ROUTES.post(post.id)}>
            {post.title}
          </Link>
        </h3>
        {isEvent && eventLine && <p className={styles.eventLine}>{eventLine}</p>}
        <p className={styles.excerpt}>{toExcerpt(post.content)}</p>
        <p className={styles.meta}>
          <AuthorLink userId={post.authorId} fallbackName={post.authorName} />
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{commentCount === 1 ? "1 comment" : `${commentCount} comments`}</span>
        </p>
      </div>
      {!isEvent && imageUrl && <img className={styles.banner} src={imageUrl} alt="" loading="lazy" />}
    </article>
  );
}
