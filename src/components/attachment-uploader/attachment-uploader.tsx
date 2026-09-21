import { useState, type ChangeEvent, type ReactElement } from "react";
import shared from "../../styles/shared.module.css";
import { ATTACHMENT_MIME_TYPES } from "../../utils/forum-constants";
import { validateFile } from "../../utils/storage";
import styles from "./attachment-uploader.module.css";

interface AttachmentUploaderProps {
  id: string;
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  /** Maximum number of files; 1 makes this a single-file picker (used for flyers). */
  maxFiles: number;
  disabled?: boolean;
}

/** Picks images and PDFs to attach, listing the chosen files with a remove button each. */
export function AttachmentUploader({
  id,
  label,
  files,
  onChange,
  maxFiles,
  disabled = false,
}: AttachmentUploaderProps): ReactElement {
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    const problem = picked.map((file) => validateFile(file, "attachment")).find((message) => message !== null);
    if (problem) {
      setError(problem);
      return;
    }
    if (maxFiles === 1) {
      setError(null);
      onChange([picked[0]]);
      return;
    }
    if (files.length + picked.length > maxFiles) {
      setError(`You can attach up to ${maxFiles} files.`);
      return;
    }
    setError(null);
    onChange([...files, ...picked]);
  }

  return (
    <div className={styles.wrapper}>
      <label className={shared.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={shared.input}
        type="file"
        accept={ATTACHMENT_MIME_TYPES.join(",")}
        multiple={maxFiles > 1}
        onChange={handleChange}
        disabled={disabled || (maxFiles > 1 && files.length >= maxFiles)}
      />
      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className={styles.item}>
              <span className={styles.name}>{file.name}</span>
              <button
                type="button"
                className={`${shared.button} ${shared.secondary} ${shared.small}`}
                onClick={() => onChange(files.filter((_, position) => position !== index))}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
