"use client";

import { useRouter } from "next/navigation";
import RealtimeTranslateView from "@/components/translation/RealtimeTranslateView";
import ShareLiveButton from "@/components/translation/ShareLiveButton";

export default function RealtimePage() {
  const router = useRouter();

  return (
    <RealtimeTranslateView
      onClose={() => router.push("/translation")}
      // Owner-only control. It lives in the view's header strip rather than
      // floating above it, and the public /live route passes nothing here.
      headerExtra={<ShareLiveButton compact />}
    />
  );
}