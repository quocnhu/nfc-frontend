"use client";

import { Suspense } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: { newPassword: string }) => {
    if (!token || !email) {
      messageApi.error("Invalid reset link");
      return;
    }
    try {
      await authApi.resetPassword({ token, email, newPassword: values.newPassword });
      messageApi.success("Password reset successful!");
      router.push("/login");
    } catch {
      messageApi.error("Reset failed");
    }
  };

  return (
    <>
      {contextHolder}
      <Card>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          Reset Password
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="newPassword" label="New Password" rules={[
            { required: true, message: 'Please enter a password' },
            { min: 8, message: 'Password must be at least 8 characters' },
            { max: 128, message: 'Password must not exceed 128 characters' },
            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=])[A-Za-z\d@$!%*?&#^()_+\-=]{8,}$/, message: 'Password must contain uppercase, lowercase, number, and special character' },
          ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
