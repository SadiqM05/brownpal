import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { RaContext } from "../../hooks/ra-context";
import type { RaIdentity } from "../../types/forum";
import { describeError } from "../../utils/errors";
import { resolveRaIdentity } from "../../utils/identity";
import styles from "./ra-provider.module.css";

interface RaProviderProps {
  children: ReactNode;
}

/** Looks up the signed-in RA once and shares it with the forum through context. */
export function RaProvider({ children }: RaProviderProps): ReactElement {
  const [ra, setRa] = useState<RaIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    resolveRaIdentity()
      .then((identity) => {
        if (active) setRa(identity);
      })
      .catch((cause: unknown) => {
        if (active) setError(describeError(cause));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p className={styles.status} role="alert">
        {error}
      </p>
    );
  }
  if (!ra) {
    return (
      <p className={styles.status} role="status">
        Loading your profile…
      </p>
    );
  }
  return <RaContext.Provider value={ra}>{children}</RaContext.Provider>;
}
