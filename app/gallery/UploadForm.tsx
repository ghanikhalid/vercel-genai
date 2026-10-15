"use client";

import { useRef, useState, useTransition } from "react";
import { generateCaptionedImageAction } from "@/app/actions";
import { IconCamera, IconSparkle } from "@/app/components/Icons";

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

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
            We send your image to Gemini Vision to craft a short, hyper-specific meme caption and superimpose it right onto the photo.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary upload-submit"
          >
            <IconSparkle size={16} />
            <span>
              {isPending
                ? "Inspecting photo & writing caption..."
                : "Generate & Post Caption"}
            </span>
          </button>

          {errorMsg && <p className="form-error">{errorMsg}</p>}
        </div>
      </div>
    </form>
  );
}
