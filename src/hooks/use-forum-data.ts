import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Comment, NewCommentInput, NewPostInput, Post, RaIdentity } from "../types/forum";
import { describeError } from "../utils/errors";
import {
  createForumComment,
  createForumPost,
  createPostRead,
  deleteForumComment,
  deleteForumPost,
  fetchCommentsByPost,
  fetchCommentsByTerm,
  fetchOwnReads,
  fetchPost,
  fetchPostsByTerm,
  softDeleteForumComment,
  subscribeToComments,
  subscribeToPosts,
  updateForumComment,
  updateForumPost,
  updatePostPinned,
} from "../utils/forum-api";
import { mergeById } from "../utils/post-filters";
import { removeStoredFiles } from "../utils/storage";
import { termOf } from "../utils/terms";
import type { ForumState } from "./forum-context";

/** Whether a term's posts and comments have arrived. */
type TermStatus = "loaded" | "failed";

/** Removes a post and its comments from local state, used for both a local delete and a live onDelete. */
function dropPost(postId: string) {
  return {
    posts: (prev: Post[]): Post[] => prev.filter((post) => post.id !== postId),
    comments: (prev: Comment[]): Comment[] => prev.filter((comment) => comment.postId !== postId),
  };
}

/** Removes one comment from local state, used for both a local delete and a live onDelete. */
function dropComment(commentId: string) {
  return (prev: Comment[]): Comment[] => prev.filter((comment) => comment.id !== commentId);
}

/** Every stored file a post references. */
function postFileKeys(post: Pick<Post, "headerImage" | "flyer" | "attachments">): string[] {
  return [post.headerImage, post.flyer, ...(post.attachments ?? [])].filter((key): key is string => Boolean(key));
}

/**
 * Loads the RA's read receipts and one academic term of posts and comments at a time, keeps them
 * live through subscriptions (create, update and delete of both posts and comments), and exposes
 * the actions. Terms already loaded stay in memory, so switching back is instant; pages filter by
 * term. A single post from any term can be pulled in with ensurePost, for links from the calendar.
 */
export function useForumData(ra: RaIdentity): ForumState {
  const [term, setTerm] = useState(() => termOf(new Date()));
  const [termStatus, setTermStatus] = useState<Readonly<Record<string, TermStatus>>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [readPostIds, setReadPostIds] = useState<ReadonlySet<string>>(new Set());
  const [readsLoaded, setReadsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedReads = useRef<Set<string>>(new Set());

  // Subscribe first so nothing created during the initial loads is missed, then load read receipts.
  useEffect(() => {
    let active = true;
    const reportError = (cause: unknown): void => {
      if (active) setError(describeError(cause));
    };

    const stopPosts = subscribeToPosts(
      (post) => setPosts((prev) => mergeById(prev, [post])),
      (post) => {
        const drop = dropPost(post.id);
        setPosts(drop.posts);
        setComments(drop.comments);
      },
      reportError,
    );
    const stopComments = subscribeToComments(
      (comment) => setComments((prev) => mergeById(prev, [comment])),
      (comment) => setComments(dropComment(comment.id)),
      reportError,
    );

    fetchOwnReads()
      .then((loadedReads) => {
        if (!active) return;
        loadedReads.forEach(({ postId }) => requestedReads.current.add(postId));
        setReadPostIds((prev) => new Set([...prev, ...loadedReads.map(({ postId }) => postId)]));
        setReadsLoaded(true);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeError(cause));
        setReadsLoaded(true);
      });

    return () => {
      active = false;
      stopPosts();
      stopComments();
    };
  }, []);

  // Load the selected term the first time it is shown.
  const selectedStatus = termStatus[term];
  useEffect(() => {
    if (selectedStatus) return;
    let active = true;
    Promise.all([fetchPostsByTerm(term), fetchCommentsByTerm(term)])
      .then(([loadedPosts, loadedComments]) => {
        if (!active) return;
        setPosts((prev) => mergeById(prev, loadedPosts));
        setComments((prev) => mergeById(prev, loadedComments));
        setTermStatus((prev) => ({ ...prev, [term]: "loaded" }));
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(describeError(cause));
        setTermStatus((prev) => ({ ...prev, [term]: "failed" }));
      });
    return () => {
      active = false;
    };
  }, [term, selectedStatus]);

  const loading = !readsLoaded || !selectedStatus;

  const ensurePost = useCallback(async (postId: string): Promise<boolean> => {
    const [post, postComments] = await Promise.all([fetchPost(postId), fetchCommentsByPost(postId)]);
    if (!post) return false;
    setPosts((prev) => mergeById(prev, [post]));
    setComments((prev) => mergeById(prev, postComments));
    return true;
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

  const deletePost = useCallback(async (post: Post): Promise<void> => {
    await deleteForumPost(post.id);
    const drop = dropPost(post.id);
    setPosts(drop.posts);
    setComments(drop.comments);
    // The post's comments, read receipts and files are removed server-side (amplify/functions/forum-cleanup).
  }, []);

  const createPost = useCallback(
    async (input: NewPostInput): Promise<Post> => {
      const post = await createForumPost(input);
      setPosts((prev) => mergeById(prev, [post]));
      void markAsRead(post.id);
      return post;
    },
    [markAsRead],
  );

  const updatePost = useCallback(async (post: Post, input: NewPostInput): Promise<Post> => {
    const updated = await updateForumPost(post.id, input);
    setPosts((prev) => mergeById(prev, [updated]));
    const keptKeys = new Set(postFileKeys(updated));
    const droppedKeys = postFileKeys(post).filter((key) => !keptKeys.has(key));
    if (droppedKeys.length > 0) void removeStoredFiles(droppedKeys);
    return updated;
  }, []);

  const addComment = useCallback(async (input: NewCommentInput): Promise<void> => {
    const comment = await createForumComment(input);
    setComments((prev) => mergeById(prev, [comment]));
  }, []);

  const editComment = useCallback(async (commentId: string, content: string): Promise<void> => {
    const updated = await updateForumComment(commentId, content);
    setComments((prev) => mergeById(prev, [updated]));
  }, []);

  const deleteComment = useCallback(async (comment: Comment, hasReplies: boolean): Promise<void> => {
    if (hasReplies) {
      const blanked = await softDeleteForumComment(comment.id);
      setComments((prev) => mergeById(prev, [blanked]));
    } else {
      await deleteForumComment(comment.id);
      setComments(dropComment(comment.id));
    }
  }, []);

  return useMemo(
    () => ({
      term,
      setTerm,
      posts,
      comments,
      readPostIds,
      loading,
      error,
      ensurePost,
      markAsRead,
      setPinned,
      deletePost,
      createPost,
      updatePost,
      addComment,
      editComment,
      deleteComment,
    }),
    [
      term,
      posts,
      comments,
      readPostIds,
      loading,
      error,
      ensurePost,
      markAsRead,
      setPinned,
      deletePost,
      createPost,
      updatePost,
      addComment,
      editComment,
      deleteComment,
    ],
  );
}
