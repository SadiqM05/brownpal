import type { ReactElement } from "react";
import { useProfiles } from "../../hooks/use-profiles";
import { useStorageUrl } from "../../hooks/use-storage-url";
import type { AvatarCrop } from "../../types/forum";
import { cropFromProfile, cropStyle } from "../../utils/avatar-crop";
import { cx } from "../../utils/class-names";
import styles from "./avatar.module.css";

interface AvatarProps {
  userId: string;
  /** Name used for the initial when the RA has no profile yet. */
  fallbackName: string;
  size?: "sm" | "md" | "lg";
  /** Shows this picture and crop instead of the saved ones; a null url shows the initial. Used by the profile form. */
  preview?: { url: string | null; crop: AvatarCrop };
}

/** Round profile picture of an RA, shown with their chosen crop, or their initial when there is no picture. Decorative: the name is shown beside it. */
export function Avatar({ userId, fallbackName, size = "md", preview }: AvatarProps): ReactElement {
  const { profiles, displayNameFor } = useProfiles();
  const profile = profiles.get(userId);
  const savedUrl = useStorageUrl(profile?.profilePicture);
  const pictureUrl = preview ? preview.url : savedUrl;
  const crop = preview ? preview.crop : cropFromProfile(profile);
  const initial = displayNameFor(userId, fallbackName).charAt(0).toUpperCase();

  return (
    <span className={cx(styles.avatar, styles[size])} aria-hidden="true">
      {pictureUrl ? <img className={styles.image} src={pictureUrl} alt="" style={cropStyle(crop)} /> : initial}
    </span>
  );
}
