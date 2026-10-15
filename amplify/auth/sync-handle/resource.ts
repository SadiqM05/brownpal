import { defineFunction } from '@aws-amplify/backend';

/** Post-authentication trigger: records the RA's verified email handle on every sign-in. */
export const syncHandle = defineFunction({
  name: 'sync-handle',
  entry: './handler.ts',
  resourceGroupName: 'auth',
});
