"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { generateCaptionedImageAction } from "@/app/actions";
import { IconCamera, IconSparkle } from "@/app/components/Icons";

const PROGRESS_STEPS = [
  "Scanning photo details...",
  "Finding a fresh comedic angle...",
  "Polishing your punchline...",
];

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!isPending) {
      setStepIdx(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % PROGRESS_STEPS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPending]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setErrorMsg(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl(null);
      setFileName("");
      return;
    }
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await generateCaptionedImageAction(formData);
      if (!result.success) {
        setErrorMsg(result.error || "Captioning failed.");
        return;
      }
      formRef.current?.reset();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setFileName("");
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="upload-studio">
      <div className="upload-studio-grid">
        <label htmlFor="image-upload" className="dropzone">
          <input
            id="image-upload"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            disabled={isPending}
            onChange={handleFileChange}
            className="sr-only-input"
          />
          {previewUrl ? (
            <div className="dropzone-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="dropzone-preview"
              />
              <span className="dropzone-change-pill">
                {fileName || "Change photo"}
              </span>
            </div>
          ) : (
            <div className="dropzone-empty">
              <div className="dropzone-icon">
                <IconCamera size={24} />
              </div>
              <p className="dropzone-title">Click to choose a photo</p>
              <p className="dropzone-hint">JPEG, PNG, WebP, or GIF up to 4.5 MB</p>
            </div>
          )}
        </label>

        <div className="upload-controls">
          <span className="kicker">AI Caption Generator</span>
          <h2 className="upload-heading">Let Gemini write the punchline.</h2>
          <p className="upload-copy">
            Upload any photo for a fresh, scene-specific caption placed cleanly underneath your image. Re-uploading the same photo spins up a brand-new joke each time.
          </p>

          <div className="upload-action-group">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary upload-submit"
            >
              <IconSparkle size={16} />
              <span>
                {isPending
                  ? "Crafting your caption..."
                  : "Generate & Post Caption"}
              </span>
            </button>

            <span className="upload-timing-note">
              Takes ~3–6 seconds while AI studies the photo.
            </span>
          </div>

          {isPending && (
            <div className="caption-progress-box" role="status" aria-live="polite">
              <div className="caption-progress-header">
                <span className="caption-progress-spinner" aria-hidden="true" />
                <span className="caption-progress-step">
                  {PROGRESS_STEPS[stepIdx]}
                </span>
              </div>
              <div className="caption-progress-track">
                <div className="caption-progress-bar" />
              </div>
              <p className="caption-progress-hint">
                Hang tight — this usually takes a few seconds.
              </p>
            </div>
          )}

          {errorMsg && <p className="form-error">{errorMsg}</p>}
        </div>
      </div>
    </form>
  );
}
