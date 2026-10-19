"use client";

import { Form, Input, Button, Card, Typography, message, Alert, Spin, Divider } from "antd";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const cooldownActive = cooldown > 0;

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/profile");
    }
  }, [status, session, router]);

  useEffect(() => {
    authApi.registrationStatus()
      .then((res) => setRegistrationEnabled(res.data.data?.enabled ?? true))
      .catch(() => setRegistrationEnabled(true));
  }, []);

  // Single interval for the whole cooldown: start once when it begins,
  // clear once it ends — ticks read the current value via functional update.
  useEffect(() => {
    if (!cooldownActive) return;
    const id = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownActive]);

  const onFinish = useCallback(async (values: { email: string; password: string }) => {
    if (cooldown > 0) return;
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      let data: { error?: string; retryAfter?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.status === 429) {
        const retryAfter = parseInt(data.retryAfter || "30", 10);
        setCooldown(retryAfter);
        messageApi.error(`Too many attempts. Please wait ${retryAfter} seconds.`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (res.status >= 500) {
          messageApi.error("Server error — please try again later.");
          setLoading(false);
          return;
        }
        const errorMsg = data.error || "Login failed";
        if (errorMsg.toLowerCase().includes("verify your email")) {
          setUnverifiedEmail(values.email);
          setLoading(false);
          return;
        }
        messageApi.error(errorMsg);
        setLoading(false);
        return;
      }

      window.location.href = "/profile";
    } catch {
      messageApi.error("Unable to reach the server. Please check your connection and try again.");
      setLoading(false);
    }
  }, [cooldown, messageApi]);

  const handleResendVerification = useCallback(async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await authApi.resendVerification({ email: unverifiedEmail });
      messageApi.success("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      messageApi.error(err.response?.data?.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  }, [unverifiedEmail, messageApi]);

  if (status === "loading") {
    return (
      <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
      </Card>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "none",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              fontSize: 24,
              color: "#fff",
              fontWeight: 700,
            }}
          >
            QN
          </div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Welcome
          </Typography.Title>
        </div>
        {unverifiedEmail && (
          <Alert
            message="Email Not Verified"
            description={
              <span>
                Please check your email to verify your account.{' '}
                <Button
                  type="link"
                  size="small"
                  loading={resending}
                  onClick={handleResendVerification}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Resend verification email
                </Button>
              </span>
            }
            type="warning"
            showIcon
            closable
            onClose={() => setUnverifiedEmail(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input prefix={<MailOutlined />} placeholder="you@example.com" disabled={cooldown > 0} />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" disabled={cooldown > 0} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              disabled={cooldown > 0}
              style={{
                height: 44,
                fontWeight: 600,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              {cooldown > 0 ? `Please wait ${cooldown}s` : "Sign In"}
            </Button>
          </Form.Item>
        </Form>
        <Divider plain style={{ color: "#6e6e73", fontSize: 13, margin: "8px 0 16px" }}>
          OR
        </Divider>
        <Button
          block
          style={{
            height: 44,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderColor: "#dadce0",
          }}
          onClick={() => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
            window.location.href = `${apiUrl}/api/auth/google`;
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          Sign in with Google
        </Button>
        <div style={{ textAlign: "center", fontSize: 14, marginTop: 16 }}>
          <Link href="/forgot-password" style={{ color: "#667eea" }}>
            Forgot password?
          </Link>
          {registrationEnabled && (
            <>
              <br />
              <span style={{ color: "#6e6e73" }}>
                Don&apos;t have an account?{" "}
              </span>
              <Link href="/register" style={{ color: "#667eea", fontWeight: 600 }}>
                Register
              </Link>
            </>
          )}
        </div>
      </Card>
    </>
  );
}
