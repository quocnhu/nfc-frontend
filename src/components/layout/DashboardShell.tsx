"use client";

import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShareAltOutlined,
  SettingOutlined,
  BulbOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";
import { useGlobalLoading } from "@/components/providers/AuthProvider";

const { Header, Sider, Content } = Layout;

const routeMap: Record<
  string,
  { icon: React.ReactNode; label: string; permission: string }
> = {
  "/dashboard": {
    icon: <DashboardOutlined />,
    label: "Dashboard",
    permission: "read:dashboard",
  },
  "/users": {
    icon: <UserOutlined />,
    label: "Users",
    permission: "read:user",
  },
  "/sharing-content": {
    icon: <ShareAltOutlined />,
    label: "Sharing",
    permission: "read:sharingcontent",
  },
  "/history": {
    icon: <HistoryOutlined />,
    label: "History",
    permission: "read:history",
  },
  "/profile": { icon: <SettingOutlined />, label: "Profile", permission: "" },
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isDark, toggle } = useTheme();
  const { showLoading, hideLoading } = useGlobalLoading();

  const user = session?.user;

  const permissions = (user as any)?.permissions as string[] | undefined;

  const menuItems = useMemo(() => {
    if (!permissions) return [];
    return Object.entries(routeMap)
      .filter(
        ([, item]) =>
          item.permission === "" || permissions.includes(item.permission)
      )
      .map(([key, item]) => ({
        key,
        icon: item.icon,
        label: item.label,
      }));
  }, [permissions]);

  const handleLogout = async () => {
    showLoading();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        theme="dark"
        style={{
          borderRight: isDark ? "1px solid #2e2e40" : undefined,
        }}
      >
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography.Title
            level={4}
            style={{
              color: "#fff",
              margin: 0,
              fontSize: collapsed ? 16 : 18,
              fontWeight: 700,
            }}
          >
            {collapsed ? "QN" : "Quoc Nhu NFC"}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 20px",
            height: 56,
            lineHeight: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isDark ? "#1a1a2e" : "#ffffff",
            borderBottom: isDark ? "1px solid #2e2e40" : "1px solid #e5e5ea",
            boxShadow: isDark
              ? "0 1px 4px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <Space size={16}>
            <Button
              type="text"
              icon={
                collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              }
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            {user && (
              <Typography.Text
                style={{
                  fontSize: 14,
                  color: isDark ? "#a0a0b0" : "#6e6e73",
                }}
              >
                Welcome,{" "}
                <span
                  style={{
                    color: isDark ? "#e0e0e8" : "#1d1d1f",
                    fontWeight: 600,
                  }}
                >
                  {user.name}
                </span>
              </Typography.Text>
            )}
          </Space>

          <Space size={12}>
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={toggle}
              style={{
                fontSize: 16,
                color: isDark ? "#fbbf24" : "#6e6e73",
              }}
            />
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <UserOutlined />,
                    label: "Profile",
                    onClick: () => router.push("/profile"),
                  },
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "Logout",
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Avatar
                style={{
                  backgroundColor: "#4f46e5",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 20,
            minHeight: "calc(100vh - 56px - 40px)",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
