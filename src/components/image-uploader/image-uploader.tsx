import { useState, type ChangeEvent, type ReactElement } from "react";
import { useFilePreview } from "../../hooks/use-file-preview";
import shared from "../../styles/shared.module.css";
import { IMAGE_MIME_TYPES } from "../../utils/forum-constants";
import { validateFile } from "../../utils/storage";
import styles from "./image-uploader.module.css";

interface ImageUploaderProps {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  /** Set to false when the caller shows its own preview of the picked image. */
  showPreview?: boolean;
}

/** Picks a single optional image (PNG, JPEG or WebP) and previews it. */
export function ImageUploader({
  id,
  label,
  file,
  onChange,
  disabled = false,
  showPreview = true,
}: ImageUploaderProps): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const preview = useFilePreview(file);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!picked) return;
    const problem = validateFile(picked, "image");
    setError(problem);
    if (!problem) onChange(picked);
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
        accept={IMAGE_MIME_TYPES.join(",")}
        onChange={handleChange}
        disabled={disabled}
      />
      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}
      {file && (
        <div className={styles.preview}>
          {showPreview && preview && <img className={styles.image} src={preview} alt={`Preview of ${file.name}`} />}
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
}
