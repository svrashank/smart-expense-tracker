const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const inrCompact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

// ₹1,24,500 (Indian digit grouping). Pass `sign` to prefix + / −.
export function formatINR(n: number, opts: { sign?: boolean } = {}) {
  const prefix = opts.sign ? (n > 0 ? "+" : n < 0 ? "−" : "") : n < 0 ? "−" : "";
  return `${prefix}₹${inr.format(Math.abs(n))}`;
}

// ₹1.2L, ₹45K: for axis ticks and tight spaces.
export const formatINRCompact = (n: number) => `₹${inrCompact.format(n)}`;

export const formatPct = (n: number, opts: { sign?: boolean } = {}) =>
  `${opts.sign && n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// "YYYY-MM-DD" parsed as a local date, not UTC midnight.
export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Value for <input type="datetime-local">
export function toDateTimeInput(iso: string) {
  const d = new Date(iso);
  return `${toDateKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export function formatDate(value: string | Date, opts: { year?: boolean } = {}) {
  const d = typeof value === "string" ? (value.length === 10 ? parseDateKey(value) : new Date(value)) : value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: opts.year ? "numeric" : undefined });
}

// "Today", "Yesterday", or "Fri, 9 Oct"
export function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (toDateKey(d) === toDateKey(today)) return "Today";
  if (toDateKey(d) === toDateKey(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

// "Today, 12:30 pm" style label used in compact lists
export const formatDateTimeShort = (iso: string) => `${formatDayLabel(iso)}, ${formatTime(iso)}`;

export const formatMonth = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

// "YYYY-MM" → "Oct"
export const formatMonthShort = (key: string) => parseDateKey(`${key}-01`).toLocaleDateString("en-IN", { month: "short" });

export function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}
