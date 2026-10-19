const ALLOWED = /^(https?:\/\/|mailto:|tel:)/i;

export function safeUrl(url: string): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return ALLOWED.test(trimmed) ? trimmed : null;
}
