export function safeValue<T>(v: T | null | undefined, fallback: T): T {
  return v ?? fallback;
}

export function toISODate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split("/").map(Number);
  return `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
}

export function normalizeTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
