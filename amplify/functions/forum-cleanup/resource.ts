import { defineFunction } from '@aws-amplify/backend';

/**
 * Runs on the Post and Comment table streams (wired up in backend.ts). It lives in the data
 * stack because it both reads those tables and is triggered by them.
 */
export const forumCleanup = defineFunction({
  name: 'forum-cleanup',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 60,
});
