"use client";

import { Form, Input, Button, Card, Typography, message } from "antd";
import { authApi } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [messageApi, contextHolder] = message.useMessage();

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
