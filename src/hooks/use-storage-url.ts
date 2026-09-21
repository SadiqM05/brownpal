import { useEffect, useState } from "react";
import { resolveFileUrl } from "../utils/storage";

/** Resolves an S3 key to a temporary URL at render time. Returns null until it is ready. */
export function useStorageUrl(key: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    resolveFileUrl(key)
      .then((url) => {
        if (active) setResolved({ key, url });
      })
      .catch(() => {
        if (active) setResolved(null);
      });
    return () => {
      active = false;
    };
  }, [key]);

  return key && resolved?.key === key ? resolved.url : null;
}
