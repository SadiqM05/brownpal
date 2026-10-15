import { useId, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useForum } from "../../hooks/use-forum";
import shared from "../../styles/shared.module.css";
import type { Category, NewPostInput, Post } from "../../types/forum";
import { describeError } from "../../utils/errors";
import {
  CATEGORY_EVENTS,
  CATEGORY_OPTIONS,
  MAX_ATTACHMENTS,
  MAX_CONTENT_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_TITLE_LENGTH,
  ROUTES,
} from "../../utils/forum-constants";
import { removeStoredFiles, uploadForumFile } from "../../utils/storage";
import { AttachmentUploader } from "../attachment-uploader/attachment-uploader";
import { FileLink } from "../file-link/file-link";
import { ImageUploader } from "../image-uploader/image-uploader";
import styles from "./post-form.module.css";

interface PostFormProps {
  /** Present when editing an existing post; absent when writing a new one. */
  post?: Post;
  /** Called with the post id once the post was created or saved. */
  onSaved: (postId: string) => void;
}

interface StoredFilesProps {
  label: string;
  keys: readonly string[];
  onRemove: (key: string) => void;
  disabled: boolean;
}

/** Files the post already has, each with a button to drop it when the edit is saved. */
function StoredFiles({ label, keys, onRemove, disabled }: StoredFilesProps): ReactElement | null {
  if (keys.length === 0) return null;
  return (
    <div className={styles.existing}>
      <span className={shared.label}>{label}</span>
      <ul className={styles.existingList}>
        {keys.map((key) => (
          <li key={key} className={styles.existingItem}>
            <FileLink storageKey={key} />
            <button
              type="button"
              className={`${shared.button} ${shared.secondary} ${shared.small}`}
              onClick={() => onRemove(key)}
              disabled={disabled}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Form for writing a new post or editing an existing one. Programs & Events posts also collect
 * date, time, location and a flyer. When editing, files the post already has can be kept,
 * removed or replaced; dropped files are deleted from storage once the edit is saved.
 */
export function PostForm({ post, onSaved }: PostFormProps): ReactElement {
  const { createPost, updatePost } = useForum();
  const fieldId = useId();
  const isEditing = Boolean(post);

  const [category, setCategory] = useState<Category>(post?.category ?? CATEGORY_OPTIONS[0].value);
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [existingHeader, setExistingHeader] = useState<string | null>(post?.headerImage ?? null);
  const [headerImage, setHeaderImage] = useState<File | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    (post?.attachments ?? []).filter((key): key is string => Boolean(key)),
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [eventDate, setEventDate] = useState(post?.eventDate ?? "");
  const [eventTime, setEventTime] = useState(post?.eventTime?.slice(0, 5) ?? "");
  const [location, setLocation] = useState(post?.location ?? "");
  const [existingFlyer, setExistingFlyer] = useState<string | null>(post?.flyer ?? null);
  const [flyer, setFlyer] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEvent = category === CATEGORY_EVENTS;
  const attachmentSlots = MAX_ATTACHMENTS - existingAttachments.length;

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>): void {
    const selected = CATEGORY_OPTIONS.find(({ value }) => value === event.target.value);
    if (selected) setCategory(selected.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      setError("Title and content are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const uploadedKeys: string[] = [];
    const upload = async (file: File): Promise<string> => {
      const key = await uploadForumFile(file);
      uploadedKeys.push(key);
      return key;
    };

    try {
      const headerImageKey = headerImage ? await upload(headerImage) : (existingHeader ?? undefined);
      const attachmentKeys = [...existingAttachments];
      for (const file of attachments) attachmentKeys.push(await upload(file));
      const flyerKey = isEvent ? (flyer[0] ? await upload(flyer[0]) : (existingFlyer ?? undefined)) : undefined;

      const input: NewPostInput = {
        category,
        title: trimmedTitle,
        content: trimmedContent,
        headerImage: headerImageKey,
        attachments: attachmentKeys,
        flyer: flyerKey,
        eventDate: isEvent ? eventDate : undefined,
        eventTime: isEvent ? eventTime : undefined,
        location: isEvent ? location.trim() : undefined,
      };
      const saved = post ? await updatePost(post, input) : await createPost(input);
      onSaved(saved.id);
    } catch (cause) {
      await removeStoredFiles(uploadedKeys);
      setError(describeError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <h1 className={styles.title}>{isEditing ? "Edit post" : "New post"}</h1>

      <div>
        <label className={shared.label} htmlFor={`${fieldId}-category`}>
          Category
        </label>
        <select
          id={`${fieldId}-category`}
          className={shared.input}
          value={category}
          onChange={handleCategoryChange}
          disabled={submitting}
        >
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={shared.label} htmlFor={`${fieldId}-title`}>
          Title
        </label>
        <input
          id={`${fieldId}-title`}
          className={shared.input}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label className={shared.label} htmlFor={`${fieldId}-content`}>
          Content
        </label>
        <textarea
          id={`${fieldId}-content`}
          className={shared.input}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_CONTENT_LENGTH}
          rows={8}
          disabled={submitting}
          required
        />
      </div>

      {!headerImage && existingHeader && (
        <StoredFiles
          label="Current header image"
          keys={[existingHeader]}
          onRemove={() => setExistingHeader(null)}
          disabled={submitting}
        />
      )}
      <ImageUploader
        id={`${fieldId}-header`}
        label={existingHeader ? "Replace header image (optional)" : "Header image (optional)"}
        file={headerImage}
        onChange={setHeaderImage}
        disabled={submitting}
      />

      <StoredFiles
        label="Current attachments"
        keys={existingAttachments}
        onRemove={(key) => setExistingAttachments((prev) => prev.filter((item) => item !== key))}
        disabled={submitting}
      />
      {attachmentSlots > 0 ? (
        <AttachmentUploader
          id={`${fieldId}-attachments`}
          label={`${existingAttachments.length > 0 ? "Add attachments" : "Attachments"} (optional, up to ${MAX_ATTACHMENTS})`}
          files={attachments}
          onChange={setAttachments}
          maxFiles={attachmentSlots}
          disabled={submitting}
        />
      ) : (
        <p className={styles.note}>
          This post has the maximum of {MAX_ATTACHMENTS} attachments. Remove one to add another.
        </p>
      )}

      {isEvent && (
        <fieldset className={styles.event} disabled={submitting}>
          <legend className={styles.legend}>Event details</legend>
          <div className={styles.eventGrid}>
            <div>
              <label className={shared.label} htmlFor={`${fieldId}-date`}>
                Event date
              </label>
              <input
                id={`${fieldId}-date`}
                className={shared.input}
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className={shared.label} htmlFor={`${fieldId}-time`}>
                Event time
              </label>
              <input
                id={`${fieldId}-time`}
                className={shared.input}
                type="time"
                value={eventTime}
                onChange={(event) => setEventTime(event.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className={shared.label} htmlFor={`${fieldId}-location`}>
              Location
            </label>
            <input
              id={`${fieldId}-location`}
              className={shared.input}
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={MAX_LOCATION_LENGTH}
              required
            />
          </div>
          {flyer.length === 0 && existingFlyer && (
            <StoredFiles
              label="Current flyer"
              keys={[existingFlyer]}
              onRemove={() => setExistingFlyer(null)}
              disabled={submitting}
            />
          )}
          <AttachmentUploader
            id={`${fieldId}-flyer`}
            label={existingFlyer ? "Replace flyer (optional)" : "Flyer (optional)"}
            files={flyer}
            onChange={setFlyer}
            maxFiles={1}
            disabled={submitting}
          />
        </fieldset>
      )}

      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={`${shared.button} ${shared.primary}`} disabled={submitting}>
          {submitting ? (isEditing ? "Saving…" : "Publishing…") : isEditing ? "Save changes" : "Publish post"}
        </button>
        <Link className={`${shared.button} ${shared.secondary}`} to={post ? ROUTES.post(post.id) : ROUTES.forum}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
