import { useId, useRef, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import shared from "../../styles/shared.module.css";
import type { AvatarCrop } from "../../types/forum";
import {
  clamp,
  cropStyle,
  DEFAULT_CROP,
  FOCUS_MAX,
  FOCUS_MIN,
  MAX_ZOOM,
  MIN_DRAG_DIVISOR,
  MIN_ZOOM,
  ZOOM_STEP,
} from "../../utils/avatar-crop";
import styles from "./avatar-cropper.module.css";

interface AvatarCropperProps {
  /** Temporary URL (or data URL) of the picture being cropped. */
  pictureUrl: string;
  crop: AvatarCrop;
  onChange: (crop: AvatarCrop) => void;
  disabled?: boolean;
}

/** Round preview where the RA drags and zooms the picture to choose which part shows in their avatar. */
export function AvatarCropper({ pictureUrl, crop, onChange, disabled = false }: AvatarCropperProps): ReactElement {
  const fieldId = useId();
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointer.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const last = lastPointer.current;
    if (!last) return;
    const size = event.currentTarget.getBoundingClientRect().width;
    const divisor = Math.max(crop.zoom - 1, MIN_DRAG_DIVISOR);
    const scale = (FOCUS_MAX / size) / divisor;
    // Dragging the photo right reveals more of its left side, so the focus moves the opposite way.
    onChange({
      ...crop,
      focusX: clamp(crop.focusX - (event.clientX - last.x) * scale, FOCUS_MIN, FOCUS_MAX),
      focusY: clamp(crop.focusY - (event.clientY - last.y) * scale, FOCUS_MIN, FOCUS_MAX),
    });
    lastPointer.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerEnd(): void {
    lastPointer.current = null;
  }

  return (
    <div className={styles.cropper}>
      <div
        className={styles.frame}
        role="img"
        aria-label="Profile picture preview. Drag to reposition."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <img className={styles.image} src={pictureUrl} alt="" draggable={false} style={cropStyle(crop)} />
      </div>

      <div className={styles.controls}>
        <div className={styles.control}>
          <label className={shared.label} htmlFor={`${fieldId}-zoom`}>
            Zoom
          </label>
          <input
            id={`${fieldId}-zoom`}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={crop.zoom}
            onChange={(event) => onChange({ ...crop, zoom: Number(event.target.value) })}
            disabled={disabled}
          />
        </div>
        <div className={styles.control}>
          <label className={shared.label} htmlFor={`${fieldId}-x`}>
            Horizontal position
          </label>
          <input
            id={`${fieldId}-x`}
            type="range"
            min={FOCUS_MIN}
            max={FOCUS_MAX}
            step={1}
            value={crop.focusX}
            onChange={(event) => onChange({ ...crop, focusX: Number(event.target.value) })}
            disabled={disabled}
          />
        </div>
        <div className={styles.control}>
          <label className={shared.label} htmlFor={`${fieldId}-y`}>
            Vertical position
          </label>
          <input
            id={`${fieldId}-y`}
            type="range"
            min={FOCUS_MIN}
            max={FOCUS_MAX}
            step={1}
            value={crop.focusY}
            onChange={(event) => onChange({ ...crop, focusY: Number(event.target.value) })}
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          className={`${shared.button} ${shared.secondary} ${shared.small}`}
          onClick={() => onChange(DEFAULT_CROP)}
          disabled={disabled}
        >
          Reset crop
        </button>
      </div>
    </div>
  );
}
