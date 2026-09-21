import { useEffect, useState } from "react";

/** Reads a picked image file into a data URL for previewing. Returns null until it is ready. */
export function useFilePreview(file: File | null): string | null {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPreview({ file, url: reader.result });
    };
    reader.readAsDataURL(file);
    return () => {
      reader.onload = null;
      reader.abort();
    };
  }, [file]);

  return file && preview?.file === file ? preview.url : null;
}
