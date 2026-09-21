import type { ReactElement } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ProfileCard } from "../components/profile-card/profile-card";
import { useCurrentRa } from "../hooks/use-current-ra";
import { useForum } from "../hooks/use-forum";
import { useProfiles } from "../hooks/use-profiles";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

const UNKNOWN_RA_NAME = "RA";

/** Read-only page for another RA profile; your own profile opens the edit page instead. */
export function ProfileViewPage(): ReactElement {
  const { userId } = useParams<{ userId: string }>();
  const ra = useCurrentRa();
  const { loading } = useProfiles();
  const { posts, comments } = useForum();

  if (!userId || userId === ra.userId) return <Navigate to={ROUTES.editProfile} replace />;

  const fallbackName =
    posts.find((post) => post.authorId === userId)?.authorName ??
    comments.find((comment) => comment.authorId === userId)?.authorName ??
    UNKNOWN_RA_NAME;

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
        <ProfileCard userId={userId} fallbackName={fallbackName} />
      )}
    </div>
  );
}
