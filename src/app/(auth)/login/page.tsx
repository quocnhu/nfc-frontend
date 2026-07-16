"use client";

import { Form, Input, Button, Card, Typography, message } from "antd";
import { useState } from "react";
import { useGlobalLoading } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function LoginPage() {
  const { showLoading } = useGlobalLoading();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        messageApi.error(data.error || "Login failed");
        setLoading(false);
        return;
      }

      showLoading();
      window.location.href = "/profile";
    } catch {
      messageApi.error("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Card>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          Login
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Login
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center" }}>
          <Link href="/forgot-password">Forgot password?</Link>
          <br />
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </div>
      </Card>
    </>
  );
}
