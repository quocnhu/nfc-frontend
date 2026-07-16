"use client";

import { Layout } from "antd";

const { Content } = Layout;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
      <Content style={{ width: "100%", maxWidth: 400, padding: 24 }}>
        {children}
      </Content>
    </Layout>
  );
}
