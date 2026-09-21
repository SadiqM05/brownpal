import { useContext } from "react";
import { ForumContext, type ForumState } from "./forum-context";

/** Returns forum data and actions. Must be used inside ForumProvider. */
export function useForum(): ForumState {
  const state = useContext(ForumContext);
  if (!state) throw new Error("useForum must be used inside ForumProvider.");
  return state;
}
