import { defineAuth } from '@aws-amplify/backend';
import { syncHandle } from './sync-handle/resource';

/**
 * Email sign-in for admin-created accounts (self sign-up is disabled in backend.ts, along with the
 * password policy). Every sign-in records the RA's verified email handle.
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  triggers: {
    postAuthentication: syncHandle,
  },
});
