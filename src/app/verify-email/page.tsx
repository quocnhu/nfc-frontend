"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, Typography, Spin, Result, Button } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    authApi
      .verifyEmail({ token, email })
      .then((res) => {
        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(res.data?.message || "Verification failed");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "none",
          textAlign: "center",
          padding: "40px 0",
        }}
      >
        <Spin size="large" />
        <Typography.Paragraph style={{ marginTop: 20, color: "#666" }}>
          Verifying your email...
        </Typography.Paragraph>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "none",
        }}
      >
        <Result
          status="success"
          title="Email Verified!"
          subTitle={message}
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          extra={[
            <Link href="/login" key="login">
              <Button type="primary" size="large">
                Go to Login
              </Button>
            </Link>,
          ]}
        />
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        border: "none",
      }}
    >
      <Result
        status="error"
        title="Verification Failed"
        subTitle={message}
        icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
        extra={[
          <Link href="/login" key="login">
            <Button type="primary">Back to Login</Button>
          </Link>,
        ]}
      />
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
