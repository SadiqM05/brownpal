import { createContext } from "react";
import type { Comment, NewCommentInput, NewPostInput, Post } from "../types/forum";

/** Forum data and the actions that change it, shared by every forum page. */
export interface ForumState {
  /** Academic term the feed shows, such as "2026-3". */
  term: string;
  setTerm: (term: string) => void;
  /** Posts of every term loaded so far, plus any fetched with ensurePost. Filter by term to show a feed. */
  posts: Post[];
  comments: Comment[];
  readPostIds: ReadonlySet<string>;
  /** True until the read receipts and the selected term have loaded. */
  loading: boolean;
  error: string | null;
  /** Loads one post and its comments from any term. Resolves false when the post does not exist. */
  ensurePost: (postId: string) => Promise<boolean>;
  markAsRead: (postId: string) => Promise<void>;
  setPinned: (postId: string, pinned: boolean) => Promise<void>;
  /** Deletes a post (its own author only); its comments, read receipts and files go with it, server-side. */
  deletePost: (post: Post) => Promise<void>;
  createPost: (input: NewPostInput) => Promise<Post>;
  /** Saves the author's edits to a post and removes any files the edit dropped or replaced. */
  updatePost: (post: Post, input: NewPostInput) => Promise<Post>;
  addComment: (input: NewCommentInput) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  /**
   * Deletes a comment (its own author only). A comment with replies is blanked and flagged
   * deleted instead, so the replies keep their place in the thread.
   */
  deleteComment: (comment: Comment, hasReplies: boolean) => Promise<void>;
}

export const ForumContext = createContext<ForumState | null>(null);
