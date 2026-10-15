import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/sync-handle';
import type { PostAuthenticationTriggerHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

/**
 * Stores the part of the RA's email before the at-sign as their handle. Cognito has verified the
 * email, and clients can't write UserHandle, so the handle shown beside a display name is genuine.
 * A failure here is logged rather than thrown, so a data hiccup never blocks sign-in.
 */
export const handler: PostAuthenticationTriggerHandler = async (event) => {
  const { sub: userId, email } = event.request.userAttributes;
  if (!userId || !email) return event;
  const handle = email.split('@')[0];

  try {
    const { data: existing } = await client.models.UserHandle.get({ userId });
    if (!existing) await client.models.UserHandle.create({ userId, handle });
    else if (existing.handle !== handle) await client.models.UserHandle.update({ userId, handle });
  } catch (error) {
    console.error('Could not record the handle for', userId, error);
  }
  return event;
};
