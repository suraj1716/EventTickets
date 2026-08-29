import { useState, useRef } from "react";
import type React from "react";
import { router, usePage } from "@inertiajs/react";
import {
  AdminBtn,
  C,
  fontBody,
} from "@/Components/Admin/AdminComponents";

/*
|--------------------------------------------------------------------------
| Legacy hook API — still used by GiftCardTemplates/Index.tsx,
| Products/Form.tsx, HeroBanner/Index.tsx, and Venues/Form.tsx.
| Not yet migrated to the AdminForm component pattern below — leave
| this in place until those are converted too, rather than breaking
| them here.
|--------------------------------------------------------------------------
*/

export function useAdminForm<T extends Record<string, any>>(initial: T) {
  const [data, setData]             = useState<T>(initial);
  const [processing, setProcessing] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Read errors directly from page props on every render
  const page = usePage();
  const rawErrors = (page.props as any).errors ?? {};
  const errors: Record<string, string> = {};
  if (!Array.isArray(rawErrors)) {
    for (const key in rawErrors) {
      const val = rawErrors[key];
      errors[key] = Array.isArray(val) ? val[0] : val;
    }
  }

  const set = (key: keyof T, value: any) =>
    setData(prev => ({ ...prev, [key]: value }));

  const post = (url: string, options?: { transform?: (d: T) => any; onSuccess?: () => void }) => {
    setProcessing(true);
    const payload = options?.transform ? options.transform(dataRef.current) : dataRef.current;
    router.post(url, payload, {
      forceFormData: payload instanceof FormData,
      preserveScroll: true,
      onSuccess: () => options?.onSuccess?.(),
      onFinish:  () => setProcessing(false),
    });
  };

  const put = (
    url: string,
    options?: {
        transform?: (d: T) => any;
        onSuccess?: () => void;
    }
  ) => {
    setProcessing(true);

    const payload = options?.transform
        ? options.transform(dataRef.current)
        : dataRef.current;

    if (payload instanceof FormData) {
        payload.append("_method", "PUT");

        router.post(url, payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => options?.onSuccess?.(),
            onFinish: () => setProcessing(false),
        });

        return;
    }

    router.post(
        url,
        {
            ...payload,
            _method: "PUT",
        },
        {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => options?.onSuccess?.(),
            onFinish: () => setProcessing(false),
        }
    );
  };

  return { data, set, errors, processing, post, put };
}

/**
 * Legacy per-field style helper — same dark palette as adminInputStyle
 * below, just keyed by (errors, field) instead of an `error` boolean
 * prop. Kept for the pages still on the legacy hook above.
 */
export function inputClass(errors: Record<string, string>, field: string): React.CSSProperties {
  const hasError = !!errors[field];
  return {
    ...adminInputStyle,
    background: hasError ? `${C.error}0D` : C.bg,
    borderColor: hasError ? C.error : C.border,
  };
}

/*
|--------------------------------------------------------------------------
| Reusable Admin Form Styles
|--------------------------------------------------------------------------
|
| All standard admin form controls should use these styles.
| This keeps every admin form visually consistent.
|
*/

export const adminInputStyle: React.CSSProperties = {
  colorScheme: "dark",
  width: "100%",
  boxSizing: "border-box",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  fontFamily: fontBody,
  fontSize: 13,
  color: C.text,
  outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
};

export const adminTextareaStyle: React.CSSProperties = {
  ...adminInputStyle,
  resize: "vertical",
  minHeight: 90,
  lineHeight: 1.5,
};

export const adminSelectStyle: React.CSSProperties = {
  ...adminInputStyle,
  cursor: "pointer",
};

export const adminCheckboxStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  accentColor: C.amber,
  cursor: "pointer",
};

export const adminLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: C.textMuted,
  marginBottom: 6,
};

export const adminErrorStyle: React.CSSProperties = {
  fontSize: 11,
  color: C.error,
  marginTop: 4,
};

export const adminHelpTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: C.textFaint,
  marginTop: 6,
};

export const adminFormSectionStyle: React.CSSProperties = {
  marginBottom: 24,
};

export const adminFormActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 32,
  paddingTop: 24,
  borderTop: `1px dashed ${C.borderDashed}`,
};

/*
|--------------------------------------------------------------------------
| AdminForm
|--------------------------------------------------------------------------
| A plain <form> wrapper. NOT a hook — form state comes from Inertia's
| own useForm() in the page component, same as everywhere else in the
| app. Keeping those separate is what avoids the
| `AdminForm<T>({...})` mix-up.
*/

interface AdminFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function AdminForm({
  children,
  style,
  ...props
}: AdminFormProps) {
  return (
    <form
      {...props}
      style={{
        width: "100%",
        ...style,
      }}
    >
      {children}
    </form>
  );
}

/*
|--------------------------------------------------------------------------
| Field
|--------------------------------------------------------------------------
*/

interface FieldProps {
  label: string;
  error?: string;
  help?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Field({
  label,
  error,
  help,
  required = false,
  children,
  style,
}: FieldProps) {
  return (
    <div
      style={{
        ...adminFormSectionStyle,
        ...style,
      }}
    >
      <label style={adminLabelStyle}>
        {label}

        {required && (
          <span
            style={{
              color: C.error,
              marginLeft: 4,
            }}
          >
            *
          </span>
        )}
      </label>

      {children}

      {help && !error && (
        <p style={adminHelpTextStyle}>
          {help}
        </p>
      )}

      {error && (
        <p style={adminErrorStyle}>
          {error}
        </p>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AdminInput
|--------------------------------------------------------------------------
*/

export interface AdminInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function AdminInput({
  error,
  style,
  ...props
}: AdminInputProps) {
  return (
    <input
      {...props}
      style={{
        ...adminInputStyle,
        ...(error
          ? {
              borderColor: C.error,
            }
          : {}),
        ...style,
      }}
    />
  );
}

/*
|--------------------------------------------------------------------------
| AdminTextarea
|--------------------------------------------------------------------------
*/

export interface AdminTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function AdminTextarea({
  error,
  style,
  ...props
}: AdminTextareaProps) {
  return (
    <textarea
      {...props}
      style={{
        ...adminTextareaStyle,
        ...(error
          ? {
              borderColor: C.error,
            }
          : {}),
        ...style,
      }}
    />
  );
}

/*
|--------------------------------------------------------------------------
| AdminSelect
|--------------------------------------------------------------------------
*/

export interface AdminSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function AdminSelect({
  error,
  style,
  children,
  ...props
}: AdminSelectProps) {
  return (
    <select
      {...props}
      style={{
        ...adminSelectStyle,
        ...(error
          ? {
              borderColor: C.error,
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </select>
  );
}

/*
|--------------------------------------------------------------------------
| AdminCheckbox
|--------------------------------------------------------------------------
*/

export interface AdminCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function AdminCheckbox({
  style,
  ...props
}: AdminCheckboxProps) {
  return (
    <input
      {...props}
      type="checkbox"
      style={{
        ...adminCheckboxStyle,
        ...style,
      }}
    />
  );
}

/*
|--------------------------------------------------------------------------
| AdminToggle — on/off pill switch, styled to match the dark theme.
| Both DepartmentForm and CategoryForm rolled their own version of this
| inline; this is that pulled out so neither has to again.
|--------------------------------------------------------------------------
*/

export interface AdminToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function AdminToggle({ checked, onChange }: AdminToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        border: "none",
        padding: 2,
        cursor: "pointer",
        background: checked ? C.amber : C.border,
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        flexShrink: 0,
        transition: "background 150ms ease",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: checked ? C.textInverse : C.textFaint,
        }}
      />
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| AdminFormActions
|--------------------------------------------------------------------------
*/

interface AdminFormActionsProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function AdminFormActions({
  children,
  style,
}: AdminFormActionsProps) {
  return (
    <div
      style={{
        ...adminFormActionsStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AdminSubmitButton
|--------------------------------------------------------------------------
*/

interface AdminSubmitButtonProps
  extends React.ComponentProps<typeof AdminBtn> {}

export function AdminSubmitButton({
  children = "Save",
  ...props
}: AdminSubmitButtonProps) {
  return (
    <AdminBtn
      type="submit"
      variant="ghost"
      {...props}
    >
      {children}
    </AdminBtn>
  );
}

/*
|--------------------------------------------------------------------------
| AdminFormGrid
|--------------------------------------------------------------------------
*/

interface AdminFormGridProps {
  children: React.ReactNode;
  columns?: string;
  gap?: number | string;
  style?: React.CSSProperties;
}

export function AdminFormGrid({
  children,
  columns = "1fr 1fr",
  gap = 8,
  style,
}: AdminFormGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AdminTag
|--------------------------------------------------------------------------
*/

interface AdminTagProps {
  children: React.ReactNode;
  onRemove?: () => void;
}

export function AdminTag({
  children,
  onRemove,
}: AdminTagProps) {
  return (
    <span
      style={{
        background: C.bgAlt,
        color: C.text,
        fontSize: 13,
        padding: "4px 12px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            color: C.textFaint,
            cursor: "pointer",
            padding: 0,
            fontSize: 15,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
