import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import "./configure";

/** Typed Amplify Data client shared by the whole app. */
export const client = generateClient<Schema>({ authMode: "userPool" });
