import type { Category, Post, PostTab } from "../types/forum";

interface FeedOptions {
  tab: PostTab;
  category: Category | null;
  readPostIds: ReadonlySet<string>;
}

/** Orders posts with pinned posts first, then newest first. */
export function sortPosts(posts: readonly Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Applies the category filter and the active tab, returning posts in feed order. */
export function buildFeed(posts: readonly Post[], options: FeedOptions): Post[] {
  const { tab, category, readPostIds } = options;
  const inCategory = category ? posts.filter((post) => post.category === category) : posts;

  switch (tab) {
    case "unread":
      return sortPosts(inCategory.filter((post) => !readPostIds.has(post.id)));
    case "seen":
      return sortPosts(inCategory.filter((post) => readPostIds.has(post.id)));
    case "pinned":
      return sortPosts(inCategory.filter((post) => post.pinned));
    case "latest":
      return sortPosts(inCategory);
  }
}

/** Counts the posts each tab would show for the current category filter. */
export function countTabs(
  posts: readonly Post[],
  category: Category | null,
  readPostIds: ReadonlySet<string>,
): Record<PostTab, number> {
  const inCategory = category ? posts.filter((post) => post.category === category) : posts;
  return {
    latest: inCategory.length,
    unread: inCategory.filter((post) => !readPostIds.has(post.id)).length,
    seen: inCategory.filter((post) => readPostIds.has(post.id)).length,
    pinned: inCategory.filter((post) => post.pinned).length,
  };
}

/** Counts posts per category. */
export function countCategories(posts: readonly Post[]): ReadonlyMap<Category, number> {
  const counts = new Map<Category, number>();
  for (const { category } of posts) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return counts;
}

/** Inserts or replaces items by key, keeping whichever copy was updated most recently. */
export function mergeByKey<T extends { updatedAt: string }>(
  current: readonly T[],
  incoming: readonly T[],
  keyOf: (item: T) => string,
): T[] {
  const byKey = new Map(current.map((item) => [keyOf(item), item]));
  for (const item of incoming) {
    const existing = byKey.get(keyOf(item));
    if (!existing || existing.updatedAt <= item.updatedAt) byKey.set(keyOf(item), item);
  }
  return [...byKey.values()];
}

/** Inserts or replaces items by id, keeping whichever copy was updated most recently. */
export function mergeById<T extends { id: string; updatedAt: string }>(
  current: readonly T[],
  incoming: readonly T[],
): T[] {
  return mergeByKey(current, incoming, (item) => item.id);
}
