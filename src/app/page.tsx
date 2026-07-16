"use client";

import { Button, Typography, Space } from "antd";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        textAlign: "center",
        padding: 24,
        overflow: "hidden",
      }}
    >
      <Typography.Title level={1} style={{ color: "#fff" }}>
        Welcome to Quoc Nhu NFC Tap!
      </Typography.Title>
      <Typography.Paragraph style={{ color: "#fff", fontSize: 18 }}>
        Make your sharing easily
      </Typography.Paragraph>
      <Space size="middle" style={{ marginTop: 24 }}>
        {user ? (
          <Button type="primary" size="large" onClick={() => router.push("/profile")}>
            Go to Dashboard
          </Button>
        ) : (
          <>
            <Button type="primary" size="large" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button size="large" onClick={() => router.push("/register")}>
              Register
            </Button>
          </>
        )}
      </Space>
    </div>
  );
}
