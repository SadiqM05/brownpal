import { useId, useState, type FormEvent, type ReactElement } from "react";
import shared from "../../styles/shared.module.css";
import { describeError } from "../../utils/errors";
import { MAX_COMMENT_LENGTH } from "../../utils/forum-constants";
import styles from "./reply-form.module.css";

interface ReplyFormProps {
  /** Accessible label of the text box. */
  label: string;
  submitLabel: string;
  /** Button text while saving. */
  pendingLabel?: string;
  /** Starting text, used when editing an existing comment. */
  initialContent?: string;
  autoFocus?: boolean;
  /** Saves the trimmed text: posts a comment or reply, or saves an edit. */
  onSubmit: (content: string) => Promise<void>;
  /** Called after the text was saved. */
  onDone?: () => void;
  /** Shows a Cancel button when set. */
  onCancel?: () => void;
}

/** Text box for writing a comment, a reply, or an edit to an existing comment. */
export function ReplyForm({
  label,
  submitLabel,
  pendingLabel = "Posting…",
  initialContent = "",
  autoFocus = false,
  onSubmit,
  onDone,
  onCancel,
}: ReplyFormProps): ReactElement {
  const inputId = useId();
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setContent("");
      onDone?.();
    } catch (cause) {
      setError(describeError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <label className={shared.srOnly} htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        className={shared.input}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={label}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        autoFocus={autoFocus}
        disabled={submitting}
        required
      />
      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="submit"
          className={`${shared.button} ${shared.primary} ${shared.small}`}
          disabled={submitting || !content.trim()}
        >
          {submitting ? pendingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
