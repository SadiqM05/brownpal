import { useEffect, useRef, useState, type MouseEvent, type ReactElement } from "react";
import shared from "../../styles/shared.module.css";
import type { AvatarCrop } from "../../types/forum";
import { AvatarCropper } from "../avatar-cropper/avatar-cropper";
import styles from "./crop-dialog.module.css";

interface CropDialogProps {
  pictureUrl: string;
  /** Crop the window opens with. */
  initialCrop: AvatarCrop;
  /** Called with the chosen crop when the RA presses Apply. */
  onApply: (crop: AvatarCrop) => void;
  /** Called on Cancel, Escape, or a click outside the window. */
  onCancel: () => void;
  /** True while the crop is being saved. */
  applying?: boolean;
  error?: string | null;
}

/** Modal window for choosing which part of the profile picture shows in the round avatar. Render it only while it should be open. */
export function CropDialog({
  pictureUrl,
  initialCrop,
  onApply,
  onCancel,
  applying = false,
  error = null,
}: CropDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initialCrop);

  // Open as a modal (focus stays inside and Escape works) as soon as it is mounted.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === event.currentTarget && !applying) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="crop-dialog-title"
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        if (!applying) onCancel();
      }}
    >
      <h2 id="crop-dialog-title" className={styles.title}>
        Adjust profile picture
      </h2>
      <p className={styles.hint}>Choose the part of your photo that shows inside the circle.</p>
      <AvatarCropper pictureUrl={pictureUrl} crop={draft} onChange={setDraft} disabled={applying} />
      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${shared.button} ${shared.secondary}`}
          onClick={onCancel}
          disabled={applying}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${shared.button} ${shared.primary}`}
          onClick={() => onApply(draft)}
          disabled={applying}
        >
          {applying ? "Applying…" : "Apply"}
        </button>
      </div>
    </dialog>
  );
}
