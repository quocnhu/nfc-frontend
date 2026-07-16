"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Spin } from "antd";

interface GlobalLoadingContextValue {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue>({
  isLoading: false,
  showLoading: () => {},
  hideLoading: () => {},
});

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext);
}

function LoadingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(255,255,255,0.7)",
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function SessionLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { isLoading } = useGlobalLoading();

  return (
    <>
      {children}
      {(status === "loading" || isLoading) && <LoadingOverlay />}
    </>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const showLoading = useCallback(() => setIsLoading(true), []);
  const hideLoading = useCallback(() => setIsLoading(false), []);

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      <SessionProvider>
        <SessionLoader>{children}</SessionLoader>
      </SessionProvider>
    </GlobalLoadingContext.Provider>
  );
}
