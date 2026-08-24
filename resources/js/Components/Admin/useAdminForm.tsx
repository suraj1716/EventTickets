import { useState, useEffect, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
import type React from "react";

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

export function inputClass(errors: Record<string, string>, field: string): React.CSSProperties {
  const hasError = !!errors[field];
  return {
    width: "100%", padding: "9px 12px",
    fontFamily: "var(--font-body)", fontSize: "13px",
    color: "var(--color-text)",
    background: hasError ? "rgba(192,57,43,0.05)" : "var(--color-bg-alt)",
    border: `1px solid ${hasError ? "#c0392b" : "var(--color-border)"}`,
    borderRadius: "var(--radius-sm)", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 150ms ease",
  };
}
