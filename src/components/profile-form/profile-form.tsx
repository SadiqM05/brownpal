import { useId, useState, type FormEvent, type ReactElement } from "react";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useFilePreview } from "../../hooks/use-file-preview";
import { useProfiles } from "../../hooks/use-profiles";
import { useStorageUrl } from "../../hooks/use-storage-url";
import shared from "../../styles/shared.module.css";
import type { AvatarCrop } from "../../types/forum";
import { cropFromProfile, DEFAULT_CROP } from "../../utils/avatar-crop";
import { describeError } from "../../utils/errors";
import { MAX_DISPLAY_NAME_LENGTH, MIN_DISPLAY_NAME_LENGTH } from "../../utils/forum-constants";
import { removeStoredFiles, uploadProfilePicture } from "../../utils/storage";
import { Avatar } from "../avatar/avatar";
import { CropDialog } from "../crop-dialog/crop-dialog";
import { ImageUploader } from "../image-uploader/image-uploader";
import styles from "./profile-form.module.css";

/** Form where the signed-in RA edits their display name, birthday, profile picture and picture crop. */
export function ProfileForm(): ReactElement {
  const ra = useCurrentRa();
  const { profiles, saveProfile } = useProfiles();
  const current = profiles.get(ra.userId);
  const fieldId = useId();
  const [displayName, setDisplayName] = useState(current?.displayName ?? ra.displayName);
  const [birthday, setBirthday] = useState(current?.birthday ?? "");
  const [newPicture, setNewPicture] = useState<File | null>(null);
  const [removePicture, setRemovePicture] = useState(false);
  const [crop, setCrop] = useState<AvatarCrop>(() => cropFromProfile(current));
  const [cropOpen, setCropOpen] = useState(false);
  const [cropApplying, setCropApplying] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filePreview = useFilePreview(newPicture);
  const savedPictureUrl = useStorageUrl(current?.profilePicture);
  const pictureUrl = newPicture ? filePreview : removePicture ? null : savedPictureUrl;
  const hasPicture = Boolean(current?.profilePicture);
  const today = new Date().toLocaleDateString("en-CA");

  // A newly chosen picture starts with a fresh crop; dropping it goes back to the saved crop.
  function handlePictureChange(file: File | null): void {
    setNewPicture(file);
    setCrop(file ? DEFAULT_CROP : cropFromProfile(current));
  }

  function closeCropDialog(): void {
    setCropOpen(false);
    setCropError(null);
  }

  // Apply in the crop window. A saved picture is re-cropped and saved at once, so the new crop
  // shows everywhere right away; a picture that is not saved yet keeps the crop until Save profile.
  async function handleApplyCrop(next: AvatarCrop): Promise<void> {
    if (newPicture || !current?.profilePicture) {
      setCrop(next);
      closeCropDialog();
      return;
    }
    setCropApplying(true);
    setCropError(null);
    try {
      await saveProfile({
        displayName: current.displayName,
        birthday: current.birthday ?? null,
        profilePicture: current.profilePicture,
        crop: next,
      });
      setCrop(next);
      setNotice("Picture crop saved.");
      closeCropDialog();
    } catch (cause) {
      setCropError(describeError(cause));
    } finally {
      setCropApplying(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const name = displayName.trim();
    if (name.length < MIN_DISPLAY_NAME_LENGTH || name.length > MAX_DISPLAY_NAME_LENGTH) {
      setError(`Display name must be ${MIN_DISPLAY_NAME_LENGTH} to ${MAX_DISPLAY_NAME_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    setNotice(null);
    setError(null);
    let uploadedKey: string | undefined;
    try {
      const previousKey = current?.profilePicture ?? null;
      let pictureKey = removePicture ? null : previousKey;
      if (newPicture) {
        uploadedKey = await uploadProfilePicture(newPicture);
        pictureKey = uploadedKey;
      }
      await saveProfile({
        displayName: name,
        birthday: birthday || null,
        profilePicture: pictureKey,
        crop: pictureKey ? crop : DEFAULT_CROP,
      });
      if (previousKey && previousKey !== pictureKey) await removeStoredFiles([previousKey]);
      setNewPicture(null);
      setRemovePicture(false);
      setNotice("Profile saved.");
    } catch (cause) {
      if (uploadedKey) await removeStoredFiles([uploadedKey]);
      setError(describeError(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <h1 className={styles.title}>Edit profile</h1>

      <div className={styles.picture}>
        <Avatar userId={ra.userId} fallbackName={ra.displayName} size="lg" preview={{ url: pictureUrl, crop }} />
        <div className={styles.pictureControls}>
          <ImageUploader
            id={`${fieldId}-picture`}
            label="Profile picture"
            file={newPicture}
            onChange={handlePictureChange}
            disabled={saving}
            showPreview={false}
          />
          <div className={styles.buttons}>
            {pictureUrl && (
              <button
                type="button"
                className={`${shared.button} ${shared.secondary} ${shared.small}`}
                onClick={() => setCropOpen(true)}
                disabled={saving}
              >
                Adjust crop
              </button>
            )}
            {hasPicture && !newPicture && (
              <button
                type="button"
                className={`${shared.button} ${shared.secondary} ${shared.small}`}
                onClick={() => setRemovePicture((value) => !value)}
                disabled={saving}
              >
                {removePicture ? "Keep current picture" : "Remove current picture"}
              </button>
            )}
          </div>
          {removePicture && !newPicture && (
            <p className={styles.hint}>Your picture will be removed when you save.</p>
          )}
          {newPicture && <p className={styles.hint}>Your new picture and its crop are saved when you press Save profile.</p>}
        </div>
      </div>

      <div>
        <label className={shared.label} htmlFor={`${fieldId}-name`}>
          Display name
        </label>
        <input
          id={`${fieldId}-name`}
          className={shared.input}
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          minLength={MIN_DISPLAY_NAME_LENGTH}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          disabled={saving}
          required
        />
      </div>

      <div>
        <label className={shared.label} htmlFor={`${fieldId}-birthday`}>
          Birthday (optional)
        </label>
        <input
          id={`${fieldId}-birthday`}
          className={shared.input}
          type="date"
          value={birthday}
          max={today}
          onChange={(event) => setBirthday(event.target.value)}
          disabled={saving}
        />
        <p className={styles.hint}>Other RAs can see your name, picture and birthday on your profile page.</p>
      </div>

      {error && (
        <p className={shared.alert} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className={styles.success} role="status">
          {notice}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={`${shared.button} ${shared.primary}`} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>

      {cropOpen && pictureUrl && (
        <CropDialog
          pictureUrl={pictureUrl}
          initialCrop={crop}
          onApply={(next) => void handleApplyCrop(next)}
          onCancel={closeCropDialog}
          applying={cropApplying}
          error={cropError}
        />
      )}
    </form>
  );
}
