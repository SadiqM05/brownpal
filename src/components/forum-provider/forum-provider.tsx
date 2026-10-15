import type { ReactElement, ReactNode } from "react";
import { ForumContext } from "../../hooks/forum-context";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useForumData } from "../../hooks/use-forum-data";

interface ForumProviderProps {
  children: ReactNode;
}

/** Loads forum data and shares it, live, with every forum page. */
export function ForumProvider({ children }: ForumProviderProps): ReactElement {
  const ra = useCurrentRa();
  const state = useForumData(ra);
  return <ForumContext.Provider value={state}>{children}</ForumContext.Provider>;
}
