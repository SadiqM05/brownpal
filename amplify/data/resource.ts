import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * RA Forum data model.
 * - Every signed-in RA can read posts, comments and calendar events.
 * - Only the record owner can edit, pin or delete their own posts, comments and events.
 * - Authorship comes from the owner field, which the backend stamps from the signed-in RA's
 *   token. Its field rule lets the owner read or delete it but never write it, so a record can't
 *   be created as, or handed to, someone else. Display names come from Profile, not the record.
 * - Profile holds each RA display name, birthday and picture: readable by every RA, writable only by that RA.
 * - PostRead tracks which posts each RA has opened, so it is private to that RA.
 * - CalendarEvent is the shared staff calendar.
 * - Posts and comments carry the academic term they were written in ("2026-3" is Fall 2026) so the
 *   forum loads one term at a time. A comment takes its post's term.
 * - editedAt is set when the author changes a post's or comment's content. A deleted comment that
 *   still has replies is blanked and flagged deleted instead of removed, so its replies keep their place.
 * - Deleting a post removes its comments, read receipts and files server-side (functions/forum-cleanup).
 * Amplify supplies createdAt / updatedAt automatically on every model.
 */
const ownerField = () =>
  a.string().authorization((allow) => [allow.owner().to(['read', 'delete']), allow.authenticated().to(['read'])]);

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
      owner: ownerField(),
      term: a.string().required(),
      category: a.ref('Category').required(),
      title: a.string().required(),
      content: a.string().required(),
      pinned: a.boolean().required().default(false),
      headerImage: a.string(),
      attachments: a.string().array(),
      flyer: a.string(),
      eventDate: a.date(),
      eventTime: a.time(),
      location: a.string(),
      editedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index('term').name('postsByTerm').queryField('listPostsByTerm'),
      index('category').name('postsByCategory').queryField('listPostsByCategory'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner(),
    ]),

  Comment: a
    .model({
      owner: ownerField(),
      postId: a.id().required(),
      term: a.string().required(),
      parentCommentId: a.id(),
      content: a.string().required(),
      editedAt: a.datetime(),
      deleted: a.boolean(),
    })
    .secondaryIndexes((index) => [
      index('term').name('commentsByTerm').queryField('listCommentsByTerm'),
      index('postId').name('commentsByPost').queryField('listCommentsByPost'),
    ])
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

  CalendarEvent: a
    .model({
      owner: ownerField(),
      title: a.string().required(),
      description: a.string().required(),
      date: a.date().required(),
      time: a.time().required(),
      attachments: a.string().array(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
