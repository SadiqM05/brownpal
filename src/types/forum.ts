import type { Schema } from "../../amplify/data/resource";

export type Post = Schema["Post"]["type"];
export type Comment = Schema["Comment"]["type"];
export type PostRead = Schema["PostRead"]["type"];
export type Profile = Schema["Profile"]["type"];
export type Category = Post["category"];

/** Tabs available on the forum feed. */
export type PostTab = "latest" | "unread" | "seen" | "pinned";

/** The signed-in RA, as shown on posts and comments. */
export interface RaIdentity {
  userId: string;
  displayName: string;
}

/** Which part of the profile picture shows inside the round avatar. */
export interface AvatarCrop {
  /** Magnification, 1 (whole photo fitted to the circle) and up. */
  zoom: number;
  /** Horizontal focus of the crop as a percentage of the photo, 0 (left) to 100 (right). */
  focusX: number;
  /** Vertical focus of the crop as a percentage of the photo, 0 (top) to 100 (bottom). */
  focusY: number;
}

/** Values collected by the profile form; null clears an optional field. */
export interface ProfileInput {
  displayName: string;
  /** AWSDate ("YYYY-MM-DD"). */
  birthday: string | null;
  /** S3 key of the profile picture. */
  profilePicture: string | null;
  crop: AvatarCrop;
}

/** Values collected by the create-post form. */
export interface NewPostInput {
  category: Category;
  title: string;
  content: string;
  headerImage?: string;
  attachments: string[];
  flyer?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
}

/** Values collected by a reply box. */
export interface NewCommentInput {
  postId: string;
  parentCommentId?: string;
  content: string;
}

/** A comment together with its nested replies. */
export interface CommentNode {
  comment: Comment;
  replies: CommentNode[];
}
