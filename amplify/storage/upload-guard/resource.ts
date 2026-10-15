import { defineFunction } from '@aws-amplify/backend';

/** Storage onUpload trigger that deletes files breaking the upload rules. Lives in the storage stack it guards. */
export const uploadGuard = defineFunction({
  name: 'upload-guard',
  entry: './handler.ts',
  resourceGroupName: 'storage',
  timeoutSeconds: 30,
});
