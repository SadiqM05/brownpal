import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { PostDetail } from "../components/post-detail/post-detail";
import { useForum } from "../hooks/use-forum";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Page for one post, looked up by the postId route parameter. */
export function PostDetailPage(): ReactElement {
  const { postId } = useParams<{ postId: string }>();
  const { posts, loading } = useForum();
  const post = posts.find(({ id }) => id === postId);

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <Link className={styles.back} to={ROUTES.forum}>
        ← Back to forum
      </Link>
      {post ? (
        <PostDetail post={post} />
      ) : (
        <p className={styles.status} role={loading ? "status" : "alert"}>
          {loading ? "Loading post…" : "This post could not be found."}
        </p>
      )}
    </div>
  );
}
