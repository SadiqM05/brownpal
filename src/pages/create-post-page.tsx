import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { PostForm } from "../components/post-form/post-form";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Page that hosts the new-post form and returns to the forum feed afterwards. */
export function CreatePostPage(): ReactElement {
  const navigate = useNavigate();

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <PostForm onSaved={() => navigate(ROUTES.forum)} />
    </div>
  );
}
