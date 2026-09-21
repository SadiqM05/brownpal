import { useMemo, type ReactElement, type ReactNode } from "react";
import { ForumContext } from "../../hooks/forum-context";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useForumData } from "../../hooks/use-forum-data";
import { useProfiles } from "../../hooks/use-profiles";
import type { RaIdentity } from "../../types/forum";

interface ForumProviderProps {
  children: ReactNode;
}

/** Loads forum data once and shares it, live, with every forum page. New posts and comments carry the RA current display name. */
export function ForumProvider({ children }: ForumProviderProps): ReactElement {
  const ra = useCurrentRa();
  const { displayNameFor } = useProfiles();
  const author = useMemo<RaIdentity>(
    () => ({ userId: ra.userId, displayName: displayNameFor(ra.userId, ra.displayName) }),
    [ra, displayNameFor],
  );
  const state = useForumData(author);
  return <ForumContext.Provider value={state}>{children}</ForumContext.Provider>;
}
