"use client";

import { Form, Input, Button, Card, Typography, message, Spin } from "antd";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/profile");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <Card style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
      </Card>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const onFinish = async (values: { email: string }) => {
    try {
      await authApi.requestReset(values);
      messageApi.success("If the email exists, a reset link has been sent.");
    } catch {
      messageApi.error("Something went wrong");
    }
  };

  return (
    <>
      {contextHolder}
      <Card>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          Forgot Password
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center" }}>
          <Link href="/login">Back to Login</Link>
        </div>
      </Card>
    </>
  );
}
