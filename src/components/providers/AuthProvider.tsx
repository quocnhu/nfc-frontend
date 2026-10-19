"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        background: "#121220",
        zIndex: 9999,
      }}>
        <Spin size="large" indicator={<LoadingOutlined style={{ color: "#e0e0e8", fontSize: 32 }} spin />} />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthLoader>{children}</AuthLoader>
    </SessionProvider>
  );
}
