// resources/js/Components/App/ui/FileDropzone.tsx
//
// Consolidates the "click-to-browse file card" pattern first built for
// Contact.tsx's quote-request attachment field. Any future page needing a
// file upload (returns, warranty claims, vendor document uploads, review
// photos, etc.) should reach for this instead of re-hand-rolling the
// click-to-open-file-input + filename-preview logic.
//
// Usage:
//   <FileDropzone
//     id="file-input"
//     file={data.file}
//     onChange={(file) => setData("file", file)}
//     accept="image/*,application/pdf"
//     hint="PDF, JPG, PNG"
//   />

import React from "react";

interface FileDropzoneProps {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  hint?: string;
}

export default function FileDropzone({
  id,
  file,
  onChange,
  accept,
  hint,
}: FileDropzoneProps) {
  return (
    <div
      className="file-upload-area"
      onClick={() => document.getElementById(id)?.click()}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <p className="file-upload-text">
        {file ? (
          <span style={{ color: "var(--color-primary)" }}>{file.name}</span>
        ) : (
          <>
            <span>Browse</span> or drag & drop
            {hint && (
              <>
                <br />
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-light)",
                  }}
                >
                  {hint}
                </span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
