import type { ReactElement } from "react";
import { useProfiles } from "../../hooks/use-profiles";
import { formatBirthday } from "../../utils/format";
import { Avatar } from "../avatar/avatar";
import styles from "./profile-card.module.css";

interface ProfileCardProps {
  userId: string;
  /** Name stored on the RA posts or comments, used when they have no profile yet. */
  fallbackName: string;
}

/** Read-only profile of an RA: picture, display name and birthday. */
export function ProfileCard({ userId, fallbackName }: ProfileCardProps): ReactElement {
  const { profiles, displayNameFor } = useProfiles();
  const profile = profiles.get(userId);

  return (
    <section className={styles.card} aria-label="RA profile">
      <Avatar userId={userId} fallbackName={fallbackName} size="lg" />
      <h1 className={styles.name}>{displayNameFor(userId, fallbackName)}</h1>
      {profile?.birthday ? (
        <p className={styles.detail}>
          <span className={styles.label}>Birthday</span>
          {formatBirthday(profile.birthday)}
        </p>
      ) : (
        <p className={styles.empty}>{profile ? "No birthday shared yet." : "This RA has not set up a profile yet."}</p>
      )}
    </section>
  );
}
