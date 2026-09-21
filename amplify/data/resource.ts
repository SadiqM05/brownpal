import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * RA Forum data model.
 * - Every signed-in RA can read posts and comments.
 * - Only the author (the record owner) can create, edit, pin or delete their own posts and comments.
 * - Profile holds each RA display name, birthday and picture: readable by every RA, writable only by that RA.
 * - PostRead tracks which posts each RA has opened, so it is private to that RA.
 * Amplify supplies createdAt / updatedAt automatically on every model.
 */
const schema = a.schema({
  Category: a.enum([
    'BUILDING_UPDATES',
    'PROGRAMS_EVENTS',
    'RA_QUESTIONS',
    'GENERAL_ANNOUNCEMENTS',
    'LOST_AND_FOUND',
  ]),

  Post: a
    .model({
      category: a.ref('Category').required(),
      title: a.string().required(),
      content: a.string().required(),
      authorId: a.string().required(),
      authorName: a.string().required(),
      pinned: a.boolean().required().default(false),
      headerImage: a.string(),
      attachments: a.string().array(),
      flyer: a.string(),
      eventDate: a.date(),
      eventTime: a.time(),
      location: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner(),
    ]),

  Comment: a
    .model({
      postId: a.id().required(),
      parentCommentId: a.id(),
      authorId: a.string().required(),
      authorName: a.string().required(),
      content: a.string().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner(),
    ]),

  Profile: a
    .model({
      userId: a.string().required(),
      displayName: a.string().required(),
      birthday: a.date(),
      profilePicture: a.string(),
      avatarZoom: a.float(),
      avatarFocusX: a.float(),
      avatarFocusY: a.float(),
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.ownerDefinedIn('userId').identityClaim('sub'),
    ]),

  PostRead: a
    .model({
      postId: a.id().required(),
      userId: a.string().required(),
    })
    .identifier(['postId', 'userId'])
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
