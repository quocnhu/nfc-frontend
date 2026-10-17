"use client";

import { useRouter } from "next/navigation";
import RealtimeTranslateView from "@/components/translation/RealtimeTranslateView";

export default function RealtimePage() {
  const router = useRouter();

  return <RealtimeTranslateView onClose={() => router.push("/translation")} />;
}