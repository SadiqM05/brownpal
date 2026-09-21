import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { ProfileForm } from "../components/profile-form/profile-form";
import { useProfiles } from "../hooks/use-profiles";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Page where the signed-in RA edits their own profile. */
export function ProfileEditPage(): ReactElement {
  const { loading } = useProfiles();

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <Link className={styles.back} to={ROUTES.forum}>
        ← Back to forum
      </Link>
      {loading ? (
        <p className={styles.status} role="status">
          Loading your profile…
        </p>
      ) : (
        <ProfileForm />
      )}
    </div>
  );
}
