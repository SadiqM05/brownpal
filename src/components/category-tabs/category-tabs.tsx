import type { ReactElement } from "react";
import type { PostTab } from "../../types/forum";
import { cx } from "../../utils/class-names";
import { TAB_OPTIONS } from "../../utils/forum-constants";
import styles from "./category-tabs.module.css";

interface CategoryTabsProps {
  activeTab: PostTab;
  counts: Record<PostTab, number>;
  onChange: (tab: PostTab) => void;
}

/** Switches the feed between Latest, Unread, Seen and Pinned posts. */
export function CategoryTabs({ activeTab, counts, onChange }: CategoryTabsProps): ReactElement {
  return (
    <div className={styles.tabs} role="group" aria-label="Filter posts">
      {TAB_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={cx(styles.tab, value === activeTab && styles.active)}
          aria-pressed={value === activeTab}
          onClick={() => onChange(value)}
        >
          <span>{label}</span>
          <span className={styles.count}>{counts[value]}</span>
        </button>
      ))}
    </div>
  );
}
