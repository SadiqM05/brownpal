import { useId, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useForum } from "../../hooks/use-forum";
import shared from "../../styles/shared.module.css";
import type { Category } from "../../types/forum";
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
import { ImageUploader } from "../image-uploader/image-uploader";
import styles from "./create-post-form.module.css";

interface CreatePostFormProps {
  /** Called with the new post id once the post was created. */
  onCreated: (postId: string) => void;
}

/** Form for a new post. Programs & Events posts also collect date, time, location and a flyer. */
export function CreatePostForm({ onCreated }: CreatePostFormProps): ReactElement {
  const { createPost } = useForum();
  const fieldId = useId();
  const [category, setCategory] = useState<Category>(CATEGORY_OPTIONS[0].value);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [headerImage, setHeaderImage] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [flyer, setFlyer] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEvent = category === CATEGORY_EVENTS;

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
      const headerImageKey = headerImage ? await upload(headerImage) : undefined;
      const attachmentKeys: string[] = [];
      for (const file of attachments) attachmentKeys.push(await upload(file));
      const flyerKey = isEvent && flyer[0] ? await upload(flyer[0]) : undefined;

      const post = await createPost({
        category,
        title: trimmedTitle,
        content: trimmedContent,
        headerImage: headerImageKey,
        attachments: attachmentKeys,
        flyer: flyerKey,
        eventDate: isEvent ? eventDate : undefined,
        eventTime: isEvent ? eventTime : undefined,
        location: isEvent ? location.trim() : undefined,
      });
      onCreated(post.id);
    } catch (cause) {
      await removeStoredFiles(uploadedKeys);
      setError(describeError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <h1 className={styles.title}>New post</h1>

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

      <ImageUploader
        id={`${fieldId}-header`}
        label="Header image (optional)"
        file={headerImage}
        onChange={setHeaderImage}
        disabled={submitting}
      />

      <AttachmentUploader
        id={`${fieldId}-attachments`}
        label={`Attachments (optional, up to ${MAX_ATTACHMENTS})`}
        files={attachments}
        onChange={setAttachments}
        maxFiles={MAX_ATTACHMENTS}
        disabled={submitting}
      />

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
          <AttachmentUploader
            id={`${fieldId}-flyer`}
            label="Flyer (optional)"
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
          {submitting ? "Publishing…" : "Publish post"}
        </button>
        <Link className={`${shared.button} ${shared.secondary}`} to={ROUTES.forum}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
