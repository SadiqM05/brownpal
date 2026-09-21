import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useProfiles } from "../../hooks/use-profiles";
import { ROUTES } from "../../utils/forum-constants";
import { Avatar } from "../avatar/avatar";
import styles from "./author-link.module.css";

interface AuthorLinkProps {
  userId: string;
  /** Name stored on the post or comment, used when the RA has no profile. */
  fallbackName: string;
  avatarSize?: "sm" | "md";
}

/** Author avatar and current display name, linking to that RA profile page. */
export function AuthorLink({ userId, fallbackName, avatarSize = "sm" }: AuthorLinkProps): ReactElement {
  const { displayNameFor } = useProfiles();

  return (
    <Link className={styles.link} to={ROUTES.profile(userId)}>
      <Avatar userId={userId} fallbackName={fallbackName} size={avatarSize} />
      <span className={styles.name}>{displayNameFor(userId, fallbackName)}</span>
    </Link>
  );
}
