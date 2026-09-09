"use client";

import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge, Spin } from "antd";
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
  FolderOpenOutlined,
  QrcodeOutlined,
  HomeOutlined,
  DollarOutlined,
  BellOutlined,
  CrownOutlined,
  TranslationOutlined,
  CodeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";
import { useAvatar } from "@/components/providers/AvatarProvider";
import { paymentApi, dashboardApi } from "@/lib/api";
import type { PaymentStatus } from "@/types";
import { RouteLoader } from "@/components/common/RouteLoader";


const { Header, Sider, Content } = Layout;

const routeMap: Record<
  string,
  { icon: React.ReactNode; label: string; permission: string; }
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
  "/subscriptions": {
    icon: <CrownOutlined />,
    label: "Subscriptions",
    permission: "read:subscription",
  },
  "/plans": {
    icon: <DollarOutlined />,
    label: "Plans",
    permission: "read:plan",
  },
  "/sharing-content": {
    icon: <ShareAltOutlined />,
    label: "Sharing",
    permission: "read:sharingcontent",
  },
  "/folder": {
    icon: <FolderOpenOutlined />,
    label: "My Files",
    permission: "read:upload",
  },
  "/qr": {
    icon: <QrcodeOutlined />,
    label: "QR Codes",
    permission: "read:qr",
  },
  "/history": {
    icon: <HistoryOutlined />,
    label: "History",
    permission: "read:history",
  },
  "/translation": {
    icon: <TranslationOutlined />,
    label: "Translations",
    permission: "read:translation",
  },
  "/homepage": {
    icon: <HomeOutlined />,
    label: "Homepage",
    permission: "read:dashboard",
  },
  "/payments": {
    icon: <DollarOutlined />,
    label: "Payments",
    permission: "read:dashboard",
  },
  "/upgrade": {
    icon: <CrownOutlined />,
    label: "Upgrade",
    permission: "",
  },
  "/profile": { icon: <SettingOutlined />, label: "Profile", permission: "" },
};

export function DashboardShell({
  children,
  initialAccess,
}: {
  children: React.ReactNode;
  initialAccess?: {
    role?: string;
    permissions?: string[];
    createdBy?: string | null;
    needsUpgrade?: boolean;
  } | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isDark, toggle } = useTheme();
  const { avatarUrl } = useAvatar();

  // Live access snapshot from the backend (refreshes on navigation so role/permission
  // changes take effect immediately instead of waiting for the 7-day session expiry).
  const [liveAccess, setLiveAccess] = useState<{
    role?: string;
    permissions?: string[];
    createdBy?: string | null;
    needsUpgrade?: boolean;
  } | null>(initialAccess ?? null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 992px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setCollapsed(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (session?.user) {
      paymentApi.status().then((res) => {
        setPaymentStatus(res.data?.data || null);
      }).catch(() => {});
    }
  }, [session, pathname]);

  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    dashboardApi
      .permissions()
      .then((res) => {
        const d = res.data?.data;
        if (!active) return;
        setLiveAccess({
          role: d?.role,
          permissions: d?.mergedPermissions || [],
          createdBy: d?.user?.createdBy || null,
          needsUpgrade: d?.needsUpgrade,
        });
      })
.catch(() => {
        if (!active) return;
        setLiveAccess({
          role: (session?.user as any)?.role as string,
          permissions: ((session?.user as any)?.permissions as string[]) || [],
          createdBy: null,
          needsUpgrade: undefined,
        });
      });
    return () => {
      active = false;
    };
  }, [pathname, session]);

  const user = session?.user;

  const permissions = liveAccess?.permissions;
  const showUpgrade = liveAccess?.needsUpgrade ?? false;
  const menuReady = liveAccess !== null;

  const menuItems = useMemo(() => {
    if (!permissions) return [];
    return Object.entries(routeMap)
      .filter(([key, item]) => {
        if (key === "/upgrade") return showUpgrade;
        return item.permission === "" || permissions.includes(item.permission);
      })
      .map(([key, item]) => ({
        key,
        icon: item.icon,
        label: item.label,
      }));
  }, [permissions, showUpgrade]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <RouteLoader />
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        theme="dark"
        style={{
          borderRight: isDark ? "1px solid #2e2e40" : undefined,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                animation: "sidebarLogoPulse 3s ease infinite",
                flexShrink: 0,
              }}
            >
              <Typography.Text strong style={{ color: "#fff", fontSize: 12, letterSpacing: 1, lineHeight: 1 }}>
                QN
              </Typography.Text>
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 13,
                  height: 13,
                  borderRadius: 5,
                  background: "linear-gradient(135deg, #00d4ff, #00a0cc)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0a0a1e",
                }}
              >
                <CodeOutlined style={{ color: "#fff", fontSize: 6 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 13,
                  height: 13,
                  borderRadius: 5,
                  background: "linear-gradient(135deg, #ffd93d, #e6b800)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0a0a1e",
                }}
              >
                <EnvironmentOutlined style={{ color: "#fff", fontSize: 6 }} />
              </div>
            </div>
            {!collapsed && (
              <Typography.Title
                level={4}
                style={{
                  color: "#fff",
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                QuocNhu
              </Typography.Title>
            )}
          </div>
          <style jsx global>{`
            @keyframes sidebarLogoPulse {
              0%, 100% { box-shadow: 0 0 12px #667eea55; }
              50% { box-shadow: 0 0 24px #764ba2aa; }
            }
          `}</style>
        </div>
        {menuReady ? (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ borderRight: 0, flex: 1, overflow: "auto", marginBottom: 80 }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: collapsed ? "16px 12px" : "16px 24px",
            background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)",
            transition: "all 0.3s ease",
            cursor: "default",
          }}
          className="sidebar-footer"
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: collapsed ? 10 : 12,
                fontWeight: 500,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.3px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                transition: "all 0.3s ease",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)",
              }}
            >
              {collapsed ? "NQ" : "Designed by Quoc Nhu"}
            </div>
          </div>
          <style jsx>{`
            .sidebar-footer:hover div:first-child {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              transform: scale(1.05);
            }
          `}</style>
        </div>
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
            {paymentStatus && !paymentStatus.isActive && paymentStatus.currentSubscription?.plan && paymentStatus.currentSubscription.plan.name !== "FREE" && (
              <Badge dot>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => router.push("/upgrade")}
                  style={{
                    fontSize: 16,
                    color: "#ff4d4f",
                  }}
                  title="NFC Service Expired - Click to Upgrade"
                />
              </Badge>
            )}
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
              {avatarUrl ? (
                <Avatar
                  src={avatarUrl}
                  style={{ cursor: "pointer" }}
                />
              ) : (
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
              )}
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: collapsed ? 12 : 20,
            minHeight: "calc(100vh - 56px - 40px)",
            transition: "margin 0.2s",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
