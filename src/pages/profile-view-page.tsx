import type { ReactElement } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ProfileCard } from "../components/profile-card/profile-card";
import { useCurrentRa } from "../hooks/use-current-ra";
import { useProfiles } from "../hooks/use-profiles";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Read-only page for another RA profile; your own profile opens the edit page instead. */
export function ProfileViewPage(): ReactElement {
  const { userId } = useParams<{ userId: string }>();
  const ra = useCurrentRa();
  const { loading } = useProfiles();

  if (!userId || userId === ra.userId) return <Navigate to={ROUTES.editProfile} replace />;

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <Link className={styles.back} to={ROUTES.forum}>
        ← Back to forum
      </Link>
      {loading ? (
        <p className={styles.status} role="status">
          Loading profile…
        </p>
      ) : (
        <ProfileCard userId={userId} />
      )}
    </div>
  );
}
