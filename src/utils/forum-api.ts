import { client } from "../amplify/client";
import type {
  Comment,
  NewCommentInput,
  NewPostInput,
  Post,
  PostRead,
  Profile,
  ProfileInput,
  RaIdentity,
} from "../types/forum";

interface Page<T> {
  data: T[];
  nextToken?: string | null;
  errors?: ReadonlyArray<{ message: string }>;
}

/** Throws one Error when an Amplify Data response carries GraphQL errors. */
function assertNoErrors(errors?: ReadonlyArray<{ message: string }>): void {
  if (errors && errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }
}

/** Reads every page of a list query. */
async function collectPages<T>(fetchPage: (nextToken?: string) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const page = await fetchPage(nextToken ?? undefined);
    assertNoErrors(page.errors);
    items.push(...page.data);
    nextToken = page.nextToken;
  } while (nextToken);
  return items;
}

/** Loads every post. */
export function fetchPosts(): Promise<Post[]> {
  return collectPages((nextToken) => client.models.Post.list({ nextToken }));
}

/** Loads every comment. */
export function fetchComments(): Promise<Comment[]> {
  return collectPages((nextToken) => client.models.Comment.list({ nextToken }));
}

/** Loads the read receipts of the signed-in RA (PostRead is private to its owner). */
export function fetchOwnReads(): Promise<PostRead[]> {
  return collectPages((nextToken) => client.models.PostRead.list({ nextToken }));
}

/** Loads every RA profile. */
export function fetchProfiles(): Promise<Profile[]> {
  return collectPages((nextToken) => client.models.Profile.list({ nextToken }));
}

/** Creates the profile of the given RA (their first save). */
export async function createProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, errors } = await client.models.Profile.create({
    userId,
    displayName: input.displayName,
    birthday: input.birthday ?? undefined,
    profilePicture: input.profilePicture ?? undefined,
    avatarZoom: input.crop.zoom,
    avatarFocusX: input.crop.focusX,
    avatarFocusY: input.crop.focusY,
  });
  assertNoErrors(errors);
  if (!data) throw new Error("The profile could not be saved.");
  return data;
}

/** Updates the profile of the given RA; null clears the birthday or picture. */
export async function updateProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, errors } = await client.models.Profile.update({
    userId,
    displayName: input.displayName,
    birthday: input.birthday,
    profilePicture: input.profilePicture,
    avatarZoom: input.crop.zoom,
    avatarFocusX: input.crop.focusX,
    avatarFocusY: input.crop.focusY,
  });
  assertNoErrors(errors);
  if (!data) throw new Error("The profile could not be saved.");
  return data;
}

/** Creates a post authored by the given RA. */
export async function createForumPost(ra: RaIdentity, input: NewPostInput): Promise<Post> {
  const { data, errors } = await client.models.Post.create({
    ...input,
    authorId: ra.userId,
    authorName: ra.displayName,
    pinned: false,
  });
  assertNoErrors(errors);
  if (!data) throw new Error("The post could not be created.");
  return data;
}

/** Pins or unpins a post. The backend only allows the post author to do this. */
export async function updatePostPinned(postId: string, pinned: boolean): Promise<Post> {
  const { data, errors } = await client.models.Post.update({ id: postId, pinned });
  assertNoErrors(errors);
  if (!data) throw new Error("The post could not be updated.");
  return data;
}

/** Creates a comment or a reply authored by the given RA. */
export async function createForumComment(ra: RaIdentity, input: NewCommentInput): Promise<Comment> {
  const { data, errors } = await client.models.Comment.create({
    ...input,
    authorId: ra.userId,
    authorName: ra.displayName,
  });
  assertNoErrors(errors);
  if (!data) throw new Error("The comment could not be posted.");
  return data;
}

/** Records that the RA has opened a post. */
export async function createPostRead(userId: string, postId: string): Promise<void> {
  const { errors } = await client.models.PostRead.create({ postId, userId });
  assertNoErrors(errors);
}

/** Subscribes to new and updated posts. Returns a function that stops both subscriptions. */
export function subscribeToPosts(onPost: (post: Post) => void, onError: (error: unknown) => void): () => void {
  const created = client.models.Post.onCreate().subscribe({ next: onPost, error: onError });
  const updated = client.models.Post.onUpdate().subscribe({ next: onPost, error: onError });
  return () => {
    created.unsubscribe();
    updated.unsubscribe();
  };
}

/** Subscribes to new comments. Returns a function that stops the subscription. */
export function subscribeToComments(
  onComment: (comment: Comment) => void,
  onError: (error: unknown) => void,
): () => void {
  const created = client.models.Comment.onCreate().subscribe({ next: onComment, error: onError });
  return () => created.unsubscribe();
}

/** Subscribes to new and updated profiles. Returns a function that stops both subscriptions. */
export function subscribeToProfiles(
  onProfile: (profile: Profile) => void,
  onError: (error: unknown) => void,
): () => void {
  const created = client.models.Profile.onCreate().subscribe({ next: onProfile, error: onError });
  const updated = client.models.Profile.onUpdate().subscribe({ next: onProfile, error: onError });
  return () => {
    created.unsubscribe();
    updated.unsubscribe();
  };
}
