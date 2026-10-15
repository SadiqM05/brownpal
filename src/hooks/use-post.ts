import { useEffect, useState } from "react";
import type { Post } from "../types/forum";
import { useForum } from "./use-forum";

/** Where a post lookup stands. */
export type PostLookup = { status: "loading" } | { status: "missing" } | { status: "found"; post: Post };

/**
 * Finds a post by id. A post outside the loaded terms (for example one opened from the calendar)
 * is fetched on its own, together with its comments.
 */
export function usePost(postId: string | undefined): PostLookup {
  const { posts, loading, ensurePost } = useForum();
  const post = posts.find(({ id }) => id === postId);
  const [missingId, setMissingId] = useState<string | null>(null);

  useEffect(() => {
    if (post || loading || !postId) return;
    let active = true;
    ensurePost(postId)
      .then((found) => {
        if (active && !found) setMissingId(postId);
      })
      .catch(() => {
        if (active) setMissingId(postId);
      });
    return () => {
      active = false;
    };
  }, [post, loading, postId, ensurePost]);

  if (post) return { status: "found", post };
  if (!postId || missingId === postId) return { status: "missing" };
  return { status: "loading" };
}
