"use client";

import { Form, Input, Button, Card, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: { fullname: string; email: string; password: string }) => {
    try {
      await authApi.signup(values);
      messageApi.success("Registration successful! Please login.");
      router.push("/login");
    } catch (err: any) {
      messageApi.error(err.response?.data?.message || "Registration failed");
    }
  };

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
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
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
