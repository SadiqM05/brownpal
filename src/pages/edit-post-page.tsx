import type { ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PostForm } from "../components/post-form/post-form";
import { useCurrentRa } from "../hooks/use-current-ra";
import { usePost } from "../hooks/use-post";
import { ROUTES } from "../utils/forum-constants";
import { isOwnedBy } from "../utils/ownership";
import styles from "./page.module.css";

/** Page for editing one post, looked up by the postId route parameter. Only its author can edit it. */
export function EditPostPage(): ReactElement {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const ra = useCurrentRa();
  const lookup = usePost(postId);

  let message: string | null = null;
  if (lookup.status === "loading") message = "Loading post…";
  else if (lookup.status === "missing") message = "This post could not be found.";
  else if (!isOwnedBy(lookup.post, ra.userId)) message = "Only the author of this post can edit it.";

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <Link className={styles.back} to={postId ? ROUTES.post(postId) : ROUTES.forum}>
        ← Back to post
      </Link>
      {lookup.status === "found" && !message ? (
        <PostForm post={lookup.post} onSaved={(savedId) => navigate(ROUTES.post(savedId))} />
      ) : (
        <p className={styles.status} role={lookup.status === "loading" ? "status" : "alert"}>
          {message}
        </p>
      )}
    </div>
  );
}
