import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactElement } from "react";
import { useCalendar } from "../../hooks/use-calendar";
import shared from "../../styles/shared.module.css";
import type { CalendarEvent, CalendarEventInput } from "../../types/calendar";
import { toAwsDate } from "../../utils/calendar-dates";
import { describeError } from "../../utils/errors";
import {
  MAX_EVENT_ATTACHMENTS,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
} from "../../utils/forum-constants";
import { removeStoredFiles, uploadCalendarFile } from "../../utils/storage";
import { AttachmentUploader } from "../attachment-uploader/attachment-uploader";
import { FileLink } from "../file-link/file-link";
import styles from "./calendar-event-modal.module.css";

interface CalendarEventModalProps {
  /** Present when editing an existing event; absent when creating a new one. */
  event?: CalendarEvent;
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
}

/** Modal form for creating or editing a calendar event. Render it only while it should be open. */
export function CalendarEventModal({ event, onClose, onSaved }: CalendarEventModalProps): ReactElement {
  const { createEvent, updateEvent } = useCalendar();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();
  const isEditing = Boolean(event);

  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? toAwsDate(new Date()));
  const [time, setTime] = useState(event?.time.slice(0, 5) ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    (event?.attachments ?? []).filter((key): key is string => Boolean(key)),
  );
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open as a modal (focus stays inside and Escape works) as soon as it is mounted.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  function handleBackdropClick(mouseEvent: MouseEvent<HTMLDialogElement>): void {
    if (mouseEvent.target === mouseEvent.currentTarget && !saving) onClose();
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle || !trimmedDescription || !date || !time) {
      setError("Title, date, time and description are required.");
      return;
    }

    setSaving(true);
    setError(null);
    const uploadedKeys: string[] = [];
    try {
      const newKeys: string[] = [];
      for (const file of newAttachments) {
        const key = await uploadCalendarFile(file);
        uploadedKeys.push(key);
        newKeys.push(key);
      }
      const input: CalendarEventInput = {
        title: trimmedTitle,
        description: trimmedDescription,
        date,
        time,
        attachments: [...existingAttachments, ...newKeys],
      };
      const saved = event ? await updateEvent(event.id, input) : await createEvent(input);
      onSaved(saved);
    } catch (cause) {
      await removeStoredFiles(uploadedKeys);
      setError(describeError(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={`${fieldId}-heading`}
      onClick={handleBackdropClick}
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        if (!saving) onClose();
      }}
    >
      <form className={styles.form} onSubmit={(formEvent) => void handleSubmit(formEvent)}>
        <h2 id={`${fieldId}-heading`} className={styles.heading}>
          {isEditing ? "Edit event" : "Add event"}
        </h2>

        <div>
          <label className={shared.label} htmlFor={`${fieldId}-title`}>
            Title
          </label>
          <input
            id={`${fieldId}-title`}
            className={shared.input}
            type="text"
            value={title}
            onChange={(inputEvent) => setTitle(inputEvent.target.value)}
            maxLength={MAX_EVENT_TITLE_LENGTH}
            disabled={saving}
            required
          />
        </div>

        <div className={styles.row}>
          <div>
            <label className={shared.label} htmlFor={`${fieldId}-date`}>
              Date
            </label>
            <input
              id={`${fieldId}-date`}
              className={shared.input}
              type="date"
              value={date}
              onChange={(inputEvent) => setDate(inputEvent.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div>
            <label className={shared.label} htmlFor={`${fieldId}-time`}>
              Time
            </label>
            <input
              id={`${fieldId}-time`}
              className={shared.input}
              type="time"
              value={time}
              onChange={(inputEvent) => setTime(inputEvent.target.value)}
              disabled={saving}
              required
            />
          </div>
        </div>

        <div>
          <label className={shared.label} htmlFor={`${fieldId}-description`}>
            Description
          </label>
          <textarea
            id={`${fieldId}-description`}
            className={shared.input}
            value={description}
            onChange={(inputEvent) => setDescription(inputEvent.target.value)}
            maxLength={MAX_EVENT_DESCRIPTION_LENGTH}
            rows={4}
            disabled={saving}
            required
          />
        </div>

        {existingAttachments.length > 0 && (
          <div className={styles.existing}>
            <span className={shared.label}>Current attachments</span>
            <ul className={styles.existingList}>
              {existingAttachments.map((key) => (
                <li key={key} className={styles.existingItem}>
                  <FileLink storageKey={key} />
                  <button
                    type="button"
                    className={`${shared.button} ${shared.secondary} ${shared.small}`}
                    onClick={() => setExistingAttachments((prev) => prev.filter((item) => item !== key))}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AttachmentUploader
          id={`${fieldId}-attachments`}
          label={`Add attachments (optional, up to ${MAX_EVENT_ATTACHMENTS})`}
          files={newAttachments}
          onChange={setNewAttachments}
          maxFiles={Math.max(MAX_EVENT_ATTACHMENTS - existingAttachments.length, 0)}
          disabled={saving}
        />

        {error && (
          <p className={shared.alert} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={`${shared.button} ${shared.secondary}`} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={`${shared.button} ${shared.primary}`} disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add event"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
