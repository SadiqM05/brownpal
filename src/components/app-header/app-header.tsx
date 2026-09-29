import type { ReactElement } from "react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../utils/forum-constants";
import { ProfileMenu } from "../profile-menu/profile-menu";
import styles from "./app-header.module.css";

interface AppHeaderProps {
  onSignOut?: () => void;
}

/** Top bar with the ResLink name, the Forum navigation entry and the profile menu. */
export function AppHeader({ onSignOut }: AppHeaderProps): ReactElement {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>ResLink</span>
        <nav aria-label="Main">
          <NavLink className={styles.navLink} to={ROUTES.forum} end>
            Forum
          </NavLink>
          <NavLink className={styles.navLink} to={ROUTES.calendar}>
            Calendar
          </NavLink>
        </nav>
        <ProfileMenu onSignOut={onSignOut} />
      </div>
    </header>
  );
}
