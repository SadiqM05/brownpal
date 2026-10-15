import type { ReactElement } from "react";
import { useProfiles } from "../../hooks/use-profiles";
import { formatBirthday } from "../../utils/format";
import { Avatar } from "../avatar/avatar";
import styles from "./profile-card.module.css";

interface ProfileCardProps {
  userId: string;
}

/** Read-only profile of an RA: picture, display name and birthday. */
export function ProfileCard({ userId }: ProfileCardProps): ReactElement {
  const { profiles, displayNameFor, handleFor } = useProfiles();
  const profile = profiles.get(userId);
  const handle = handleFor(userId);

  return (
    <section className={styles.card} aria-label="RA profile">
      <Avatar userId={userId} size="lg" />
      <h1 className={styles.name}>{displayNameFor(userId)}</h1>
      {handle && <p className={styles.handle}>@{handle}</p>}
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
