import { useId, useState, type FormEvent, type ReactElement } from "react";
import { useForum } from "../../hooks/use-forum";
import shared from "../../styles/shared.module.css";
import { describeError } from "../../utils/errors";
import { MAX_COMMENT_LENGTH } from "../../utils/forum-constants";
import styles from "./reply-form.module.css";

interface ReplyFormProps {
  postId: string;
  /** Set when replying to an existing comment; omitted for a top-level comment. */
  parentCommentId?: string;
  /** Accessible label of the text box. */
  label: string;
  submitLabel: string;
  autoFocus?: boolean;
  /** Called after the comment was posted, and when the RA cancels. */
  onDone?: () => void;
}

/** Text box that posts a comment on a post or a reply to another comment. */
export function ReplyForm({
  postId,
  parentCommentId,
  label,
  submitLabel,
  autoFocus = false,
  onDone,
}: ReplyFormProps): ReactElement {
  const { addComment } = useForum();
  const inputId = useId();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await addComment({ postId, parentCommentId, content: trimmed });
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
          {submitting ? "Posting…" : submitLabel}
        </button>
        {parentCommentId && (
          <button
            type="button"
            className={`${shared.button} ${shared.secondary} ${shared.small}`}
            onClick={onDone}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
