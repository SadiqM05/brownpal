import type { ReactElement } from "react";
import { useStorageUrl } from "../../hooks/use-storage-url";
import { fileNameFromKey } from "../../utils/format";
import styles from "./file-link.module.css";

const IMAGE_EXTENSION = /\.(png|jpe?g|webp)$/i;

interface FileLinkProps {
  /** S3 key of the stored file. */
  storageKey: string;
}

/** Downloadable link to a stored file; images also show a thumbnail. */
export function FileLink({ storageKey }: FileLinkProps): ReactElement {
  const url = useStorageUrl(storageKey);
  const name = fileNameFromKey(storageKey);

  if (!url) return <span className={styles.pending}>{name}</span>;

  return (
    <a className={styles.link} href={url} target="_blank" rel="noopener noreferrer" download={name}>
      {IMAGE_EXTENSION.test(name) ? (
        <img className={styles.thumb} src={url} alt="" loading="lazy" />
      ) : (
        <span aria-hidden="true">📎</span>
      )}
      <span className={styles.name}>{name}</span>
    </a>
  );
}
