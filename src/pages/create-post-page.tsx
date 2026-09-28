import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { CreatePostForm } from "../components/create-post-form/create-post-form";
import { ROUTES } from "../utils/forum-constants";
import styles from "./page.module.css";

/** Page that hosts the create-post form and returns to the forum feed afterwards. */
export function CreatePostPage(): ReactElement {
  const navigate = useNavigate();

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <CreatePostForm onCreated={() => navigate(ROUTES.forum)} />
    </div>
  );
}
