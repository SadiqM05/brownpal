import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import type { Category, Post, PostTab } from "../../types/forum";
import { cx } from "../../utils/class-names";
import { CATEGORY_OPTIONS, ROUTES } from "../../utils/forum-constants";
import { CategoryTabs } from "../category-tabs/category-tabs";
import styles from "./sidebar.module.css";

interface SidebarProps {
  /** Selected category, or null for all categories. */
  category: Category | null;
  onCategoryChange: (category: Category | null) => void;
  activeTab: PostTab;
  onTabChange: (tab: PostTab) => void;
  tabCounts: Record<PostTab, number>;
  categoryCounts: ReadonlyMap<Category, number>;
  totalCount: number;
  pinnedPosts: Post[];
}

/** Forum navigation: feed tabs, category filter and a shortcut list of pinned posts. */
export function Sidebar({
  category,
  onCategoryChange,
  activeTab,
  onTabChange,
  tabCounts,
  categoryCounts,
  totalCount,
  pinnedPosts,
}: SidebarProps): ReactElement {
  return (
    <aside className={styles.sidebar} aria-label="Forum navigation">
      <section className={styles.section}>
        <h2 className={styles.heading}>Show</h2>
        <CategoryTabs activeTab={activeTab} counts={tabCounts} onChange={onTabChange} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Categories</h2>
        <div className={styles.list} role="group" aria-label="Filter by category">
          <button
            type="button"
            className={cx(styles.item, category === null && styles.active)}
            aria-pressed={category === null}
            onClick={() => onCategoryChange(null)}
          >
            <span>All categories</span>
            <span className={styles.count}>{totalCount}</span>
          </button>
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={cx(styles.item, category === value && styles.active)}
              aria-pressed={category === value}
              onClick={() => onCategoryChange(value)}
            >
              <span>{label}</span>
              <span className={styles.count}>{categoryCounts.get(value) ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      {pinnedPosts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Pinned posts</h2>
          <ul className={styles.pinned}>
            {pinnedPosts.map((post) => (
              <li key={post.id}>
                <Link className={styles.pinnedLink} to={ROUTES.post(post.id)}>
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
