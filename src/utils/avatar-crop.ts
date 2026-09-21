import type { CSSProperties } from "react";
import type { AvatarCrop, Profile } from "../types/forum";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.05;
export const FOCUS_MIN = 0;
export const FOCUS_MAX = 100;
const FOCUS_CENTER = 50;

/** Crop shown when an RA has not adjusted their picture: whole photo, centered. */
export const DEFAULT_CROP: AvatarCrop = { zoom: MIN_ZOOM, focusX: FOCUS_CENTER, focusY: FOCUS_CENTER };

/**
 * Dragging moves the focus by (drag distance / circle size) divided by (zoom - 1), so the photo
 * follows the pointer. The divisor never drops below this, which keeps panning calm near 1x.
 * Raise it for slower dragging, lower it for faster.
 */
export const MIN_DRAG_DIVISOR = 0.5;

/** Limits a number to the given range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Reads the saved crop of a profile, falling back to the default and keeping values in range. */
export function cropFromProfile(profile: Profile | undefined): AvatarCrop {
  return {
    zoom: clamp(profile?.avatarZoom ?? DEFAULT_CROP.zoom, MIN_ZOOM, MAX_ZOOM),
    focusX: clamp(profile?.avatarFocusX ?? DEFAULT_CROP.focusX, FOCUS_MIN, FOCUS_MAX),
    focusY: clamp(profile?.avatarFocusY ?? DEFAULT_CROP.focusY, FOCUS_MIN, FOCUS_MAX),
  };
}

/**
 * Inline style that shows the chosen part of a photo inside a round, overflow-hidden frame.
 * The photo is fitted to the frame (object-fit: cover), positioned at the focus, then magnified
 * around that same focus point, so the frame is always fully covered.
 */
export function cropStyle({ zoom, focusX, focusY }: AvatarCrop): CSSProperties {
  const origin = `${focusX}% ${focusY}%`;
  return { objectPosition: origin, transformOrigin: origin, transform: `scale(${zoom})` };
}
