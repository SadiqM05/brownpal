import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { PostCard } from "../components/post-card/post-card";
import { Sidebar } from "../components/sidebar/sidebar";
import { useForum } from "../hooks/use-forum";
import shared from "../styles/shared.module.css";
import type { Category, PostTab } from "../types/forum";
import { countCommentsByPost } from "../utils/comment-tree";
import { ROUTES } from "../utils/forum-constants";
import { buildFeed, countCategories, countTabs, sortPosts } from "../utils/post-filters";
import { termOf, termsThrough } from "../utils/terms";
import styles from "./page.module.css";

/** Main forum page: sidebar filters and the live feed of one academic term's posts. */
export function ForumPage(): ReactElement {
  const { term, setTerm, posts: allPosts, comments, readPostIds, loading, error } = useForum();
  const terms = useMemo(() => termsThrough(termOf(new Date())), []);
  const posts = useMemo(() => allPosts.filter((post) => post.term === term), [allPosts, term]);
  const [category, setCategory] = useState<Category | null>(null);
  const [tab, setTab] = useState<PostTab>("latest");

  const feed = useMemo(
    () => buildFeed(posts, { tab, category, readPostIds }),
    [posts, tab, category, readPostIds],
  );
  const tabCounts = useMemo(() => countTabs(posts, category, readPostIds), [posts, category, readPostIds]);
  const categoryCounts = useMemo(() => countCategories(posts), [posts]);
  const commentCounts = useMemo(() => countCommentsByPost(comments), [comments]);
  const pinnedPosts = useMemo(() => sortPosts(posts.filter((post) => post.pinned)), [posts]);

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>RA Forum</h1>
        <Link className={`${shared.button} ${shared.primary}`} to={ROUTES.newPost}>
          New post
        </Link>
      </div>

      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}

      <div className={styles.layout}>
        <Sidebar
          term={term}
          terms={terms}
          onTermChange={setTerm}
          category={category}
          onCategoryChange={setCategory}
          activeTab={tab}
          onTabChange={setTab}
          tabCounts={tabCounts}
          categoryCounts={categoryCounts}
          totalCount={posts.length}
          pinnedPosts={pinnedPosts}
        />
        <section aria-label="Posts">
          {loading ? (
            <p className={styles.status} role="status">
              Loading posts…
            </p>
          ) : feed.length === 0 ? (
            <p className={styles.status}>No posts to show here yet.</p>
          ) : (
            <ul className={styles.feed}>
              {feed.map((post) => (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    commentCount={commentCounts.get(post.id) ?? 0}
                    isRead={readPostIds.has(post.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
