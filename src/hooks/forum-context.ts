import { createContext } from "react";
import type { Comment, NewCommentInput, NewPostInput, Post } from "../types/forum";

/** Forum data and the actions that change it, shared by every forum page. */
export interface ForumState {
  posts: Post[];
  comments: Comment[];
  readPostIds: ReadonlySet<string>;
  loading: boolean;
  error: string | null;
  markAsRead: (postId: string) => Promise<void>;
  setPinned: (postId: string, pinned: boolean) => Promise<void>;
  createPost: (input: NewPostInput) => Promise<Post>;
  addComment: (input: NewCommentInput) => Promise<void>;
}

export const ForumContext = createContext<ForumState | null>(null);
