"use client";

import { Form, Input, Button, Card, Typography, message, Spin, Result } from "antd";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/profile");
    }
  }, [status, session, router]);

  useEffect(() => {
    authApi.registrationStatus()
      .then((res) => setEnabled(res.data.data?.enabled ?? true))
      .catch(() => setEnabled(true))
      .finally(() => setLoading(false));
  }, []);

  if (status === "loading" || loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const onFinish = async (values: { fullname: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      const { confirmPassword, ...payload } = values;
      await authApi.signup(payload);
      messageApi.success({
        content: "Registration successful! Please check your email to verify your account.",
        duration: 13,
      });
      setTimeout(() => {
        router.push("/login");
      }, 13000);
    } catch (err: any) {
      messageApi.error(err.response?.data?.message || "Registration failed");
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!enabled) {
    return (
      <Card>
        <Result
          status="warning"
          title="Registration is not available"
          subTitle="New account registration is currently disabled. Please contact an administrator if you need access."
          extra={<Link href="/login"><Button type="primary">Back to Login</Button></Link>}
        />
      </Card>
    );
  }

  return (
    <>
      {contextHolder}
      <Card>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          Register
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="fullname" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[
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
            dependencies={["password"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
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
              Register
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center" }}>
          Already have an account? <Link href="/login">Login</Link>
        </div>
      </Card>
    </>
  );
}
