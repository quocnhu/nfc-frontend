"use client";

import { useRouter } from "next/navigation";
import RealtimeTranslateView from "@/components/translation/RealtimeTranslateView";

/**
 * Public realtime translator.
 *
 * Deliberately outside the (dashboard) group: no AuthGuard, no dashboard shell,
 * no session cookie required. A stranger who scans the QR lands here and can
 * translate immediately.
 *
 * Each visitor gets their own private session — the socket keys state by
 * connection id, so nothing is shared between visitors and there is no
 * transcript to leak.
 */
export default function PublicLivePage() {
  const router = useRouter();

  // "Close" sends a guest back to the landing page; there is no dashboard for
  // them to return to.
  return <RealtimeTranslateView onClose={() => router.push("/")} />;
}