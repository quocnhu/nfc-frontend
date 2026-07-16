"use client";

import { useState, useCallback } from "react";

interface NfcResult {
  userId: string;
}

export const useNfc = () => {
  const [isReading, setIsReading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupport = useCallback(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const startReading = useCallback(
    async (onRead: (result: NfcResult) => void) => {
      if (!isSupported) {
        setError("NFC is not supported on this device/browser");
        return;
      }

      setIsReading(true);
      setError(null);

      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        ndef.addEventListener("reading", ({ message }: any) => {
          const record = message.records[0];
          const textDecoder = new TextDecoder();
          const payload = textDecoder.decode(record.data);

          onRead({ userId: payload });
          setIsReading(false);
        });

        ndef.addEventListener("readingerror", () => {
          setError("Error reading NFC tag");
          setIsReading(false);
        });
      } catch (err) {
        setError("Failed to start NFC reader");
        setIsReading(false);
      }
    },
    [isSupported]
  );

  return { isSupported, isReading, error, checkSupport, startReading };
};
