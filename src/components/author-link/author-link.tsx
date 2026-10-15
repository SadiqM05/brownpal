import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useProfiles } from "../../hooks/use-profiles";
import { ROUTES } from "../../utils/forum-constants";
import { Avatar } from "../avatar/avatar";
import styles from "./author-link.module.css";

interface AuthorLinkProps {
  userId: string;
  avatarSize?: "sm" | "md";
}

/** Author avatar, current display name and verified handle, linking to that RA profile page. */
export function AuthorLink({ userId, avatarSize = "sm" }: AuthorLinkProps): ReactElement {
  const { displayNameFor, handleFor } = useProfiles();
  const handle = handleFor(userId);

  return (
    <Link className={styles.link} to={ROUTES.profile(userId)}>
      <Avatar userId={userId} size={avatarSize} />
      <span className={styles.name}>{displayNameFor(userId)}</span>
      {handle && <span className={styles.handle}>@{handle}</span>}
    </Link>
  );
}
