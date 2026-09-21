import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useCurrentRa } from "../../hooks/use-current-ra";
import { useProfiles } from "../../hooks/use-profiles";
import { ROUTES } from "../../utils/forum-constants";
import { Avatar } from "../avatar/avatar";
import styles from "./profile-menu.module.css";

interface ProfileMenuProps {
  onSignOut?: () => void;
}

/** Profile picture button in the header that opens a menu with Edit profile and Sign out. */
export function ProfileMenu({ onSignOut }: ProfileMenuProps): ReactElement {
  const ra = useCurrentRa();
  const { displayNameFor } = useProfiles();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // While open, close the menu on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent): void => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar userId={ra.userId} fallbackName={ra.displayName} size="md" />
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label="Account">
          <p className={styles.name}>{displayNameFor(ra.userId, ra.displayName)}</p>
          <Link className={styles.item} role="menuitem" to={ROUTES.editProfile} onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          <button
            type="button"
            className={styles.item}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut?.();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
