"use client";

import { Form, Input, Button, Card, Typography, message, Alert, Spin } from "antd";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

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

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current!);
    };
  }, [cooldown]);

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

      const data = await res.json();

      if (res.status === 429) {
        const retryAfter = parseInt(data.retryAfter || "30", 10);
        setCooldown(retryAfter);
        messageApi.error(`Too many attempts. Please wait ${retryAfter} seconds.`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
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
      messageApi.error("Invalid email or password");
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
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            Sign in to your NFC account
          </Typography.Text>
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
        <div style={{ textAlign: "center", fontSize: 14 }}>
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
