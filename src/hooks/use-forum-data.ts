import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Comment, NewCommentInput, NewPostInput, Post, RaIdentity } from "../types/forum";
import { describeError } from "../utils/errors";
import {
  createForumComment,
  createForumPost,
  createPostRead,
  fetchComments,
  fetchOwnReads,
  fetchPosts,
  subscribeToComments,
  subscribeToPosts,
  updatePostPinned,
} from "../utils/forum-api";
import { mergeById } from "../utils/post-filters";
import type { ForumState } from "./forum-context";

/**
 * Loads posts, comments and the RA read receipts, keeps them live through
 * subscriptions (onCreatePost, onUpdatePost, onCreateComment), and exposes the actions.
 */
export function useForumData(ra: RaIdentity): ForumState {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [readPostIds, setReadPostIds] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestedReads = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const reportError = (cause: unknown): void => {
      if (active) setError(describeError(cause));
    };

    // Subscribe first so nothing created during the initial load is missed.
    const stopPosts = subscribeToPosts((post) => setPosts((prev) => mergeById(prev, [post])), reportError);
    const stopComments = subscribeToComments(
      (comment) => setComments((prev) => mergeById(prev, [comment])),
      reportError,
    );

    Promise.all([fetchPosts(), fetchComments(), fetchOwnReads()])
      .then(([loadedPosts, loadedComments, loadedReads]) => {
        if (!active) return;
        loadedReads.forEach(({ postId }) => requestedReads.current.add(postId));
        setPosts((prev) => mergeById(prev, loadedPosts));
        setComments((prev) => mergeById(prev, loadedComments));
        setReadPostIds((prev) => new Set([...prev, ...loadedReads.map(({ postId }) => postId)]));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeError(cause));
        setLoading(false);
      });

    return () => {
      active = false;
      stopPosts();
      stopComments();
    };
  }, []);

  const markAsRead = useCallback(
    async (postId: string): Promise<void> => {
      if (requestedReads.current.has(postId)) return;
      requestedReads.current.add(postId);
      setReadPostIds((prev) => new Set(prev).add(postId));
      try {
        await createPostRead(ra.userId, postId);
      } catch (cause) {
        requestedReads.current.delete(postId);
        setReadPostIds((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setError(describeError(cause));
      }
    },
    [ra.userId],
  );

  const setPinned = useCallback(async (postId: string, pinned: boolean): Promise<void> => {
    const updated = await updatePostPinned(postId, pinned);
    setPosts((prev) => mergeById(prev, [updated]));
  }, []);

  const createPost = useCallback(
    async (input: NewPostInput): Promise<Post> => {
      const post = await createForumPost(ra, input);
      setPosts((prev) => mergeById(prev, [post]));
      void markAsRead(post.id);
      return post;
    },
    [ra, markAsRead],
  );

  const addComment = useCallback(
    async (input: NewCommentInput): Promise<void> => {
      const comment = await createForumComment(ra, input);
      setComments((prev) => mergeById(prev, [comment]));
    },
    [ra],
  );

  return useMemo(
    () => ({ posts, comments, readPostIds, loading, error, markAsRead, setPinned, createPost, addComment }),
    [posts, comments, readPostIds, loading, error, markAsRead, setPinned, createPost, addComment],
  );
}
