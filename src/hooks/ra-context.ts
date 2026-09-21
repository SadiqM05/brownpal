import { createContext } from "react";
import type { RaIdentity } from "../types/forum";

export const RaContext = createContext<RaIdentity | null>(null);
