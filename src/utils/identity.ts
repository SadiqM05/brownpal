import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import "../amplify/configure";
import type { RaIdentity } from "../types/forum";

/**
 * Resolves the signed-in RA. RA emails look like amoham26@vols.utk.edu, and the part
 * before the at-sign (amoham26) is the display name shown on posts and comments.
 */
export async function resolveRaIdentity(): Promise<RaIdentity> {
  const user = await getCurrentUser();
  const email = user.signInDetails?.loginId ?? (await fetchUserAttributes()).email ?? user.username;
  return { userId: user.userId, displayName: email.split("@")[0] };
}
