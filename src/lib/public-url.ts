/**
 * Base URL used when generating shareable links and QR codes.
 *
 * Prefers NEXT_PUBLIC_PUBLIC_URL so a QR generated on localhost still points at
 * a reachable host (deployed domain or LAN IP). Falls back to the browser's
 * current origin, which is correct on any deployed host.
 */
export function getPublicBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_PUBLIC_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
