import { useEffect, useRef, type MouseEvent, type ReactElement } from "react";
import shared from "../../styles/shared.module.css";
import styles from "./confirm-dialog.module.css";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** True while the confirmed action is in progress. */
  confirming?: boolean;
  error?: string | null;
}

/** Modal window that asks the RA to confirm a destructive action before it happens. Render it only while it should be open. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  confirming = false,
  error = null,
}: ConfirmDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open as a modal (focus stays inside and Escape works) as soon as it is mounted.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>): void {
    if (event.target === event.currentTarget && !confirming) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="confirm-dialog-title"
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        if (!confirming) onCancel();
      }}
    >
      <h2 id="confirm-dialog-title" className={styles.title}>
        {title}
      </h2>
      <p className={styles.message}>{message}</p>
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
          disabled={confirming}
        >
          Cancel
        </button>
        <button type="button" className={`${shared.button} ${styles.danger}`} onClick={onConfirm} disabled={confirming}>
          {confirming ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
