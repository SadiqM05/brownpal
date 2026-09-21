import { useContext } from "react";
import type { RaIdentity } from "../types/forum";
import { RaContext } from "./ra-context";

/** Returns the signed-in RA. Must be used inside RaProvider. */
export function useCurrentRa(): RaIdentity {
  const ra = useContext(RaContext);
  if (!ra) throw new Error("useCurrentRa must be used inside RaProvider.");
  return ra;
}
