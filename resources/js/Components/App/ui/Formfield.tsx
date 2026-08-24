// resources/js/Components/App/ui/FormField.tsx
//
// Consolidates the "label + field + error message" block that was hand-rolled
// per field in Contact.tsx (and will otherwise get copy-pasted into every
// future form page): a <div className="form-group">, a <label>, the actual
// input/select/textarea, then a conditional <p className="field-error">.
//
// Usage:
//   <FormField id="email" label="Email Address" error={errors.email}>
//     <input id="email" type="email" value={data.email} onChange={...} required />
//   </FormField>
//
//   // inside a .form-row, where the row handles spacing instead of the field:
//   <FormField id="name" label="Full Name" error={errors.name} noMargin>
//     ...
//   </FormField>

import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  /** Removes the field's own bottom margin (used inside a .form-row that already spaces its children) */
  noMargin?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function FormField({
  id,
  label,
  error,
  children,
  noMargin = false,
  className = "",
  style,
}: FormFieldProps) {
  return (
    <div
      className={["form-group", className].filter(Boolean).join(" ")}
      style={{ ...(noMargin ? { marginBottom: 0 } : undefined), ...style }}
    >
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
