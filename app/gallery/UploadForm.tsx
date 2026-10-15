"use client";

import { useRef, useState, useTransition } from "react";
import { generateCaptionedImageAction } from "@/app/actions";

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await generateCaptionedImageAction(formData);
      if (!result.success) {
        setErrorMsg(result.error || "Captioning failed.");
        return;
      }
      formRef.current?.reset();
      setPreviewUrl("");
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="panel stack" style={{ marginTop: 28 }}>
      <p className="kicker">New print</p>
      <div className="field">
        <label htmlFor="image">Photograph</label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(file ? URL.createObjectURL(file) : "");
          }}
        />
      </div>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="preview" src={previewUrl} alt="Selected photograph preview" />
      )}

      <button className="btn btn-blood" type="submit" disabled={isPending}>
        {isPending ? "Reading the room..." : "Caption this photograph"}
      </button>

      {errorMsg && <p className="err">{errorMsg}</p>}
    </form>
  );
}
