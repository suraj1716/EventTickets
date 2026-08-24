export function formatDate(date?: string | null): string {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC", // Prevent timezone shifting
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateRange(
  from?: string | null,
  to?: string | null
): string {
  return `${formatDate(from)} → ${formatDate(to)}`;
}

// resources/js/utils/dateFormat.ts — add alongside formatDatetimeLocal

export function formatDateInput(value: string | null | undefined): string {
  if (!value) return '';
  // Take just the date portion of an ISO string, e.g.
  // "2026-08-27T14:00:00.000000Z" -> "2026-08-27"
  return value.slice(0, 10);
}


export function formatDatetimeLocal(
  date?: string | null
): string {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const pad = (value: number) =>
    String(value).padStart(2, "0");

  return `${parsed.getFullYear()}-${pad(
    parsed.getMonth() + 1
  )}-${pad(parsed.getDate())}T${pad(
    parsed.getHours()
  )}:${pad(parsed.getMinutes())}`;
}
