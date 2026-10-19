/**
 * extractApiError — turn an axios rejection into something worth showing.
 *
 * The backend returns `{ message }` for most failures, and Nest's validation
 * pipe returns `message` as an array of strings. Both shapes are flattened to
 * one line here rather than at each call site.
 */
export function extractApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  const msg = data?.message;
  return Array.isArray(msg) ? msg.join(", ") : msg || fallback;
}