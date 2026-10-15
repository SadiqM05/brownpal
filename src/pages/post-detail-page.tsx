import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { PostDetail } from "../components/post-detail/post-detail";
import { usePost } from "../hooks/use-post";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Page for one post, looked up by the postId route parameter, from any term. */
export function PostDetailPage(): ReactElement {
  const { postId } = useParams<{ postId: string }>();
  const lookup = usePost(postId);

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <Link className={styles.back} to={ROUTES.forum}>
        ← Back to forum
      </Link>
      {lookup.status === "found" ? (
        <PostDetail post={lookup.post} />
      ) : (
        <p className={styles.status} role={lookup.status === "loading" ? "status" : "alert"}>
          {lookup.status === "loading" ? "Loading post…" : "This post could not be found."}
        </p>
      )}
    </div>
  );
}
