"use client";

import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge, Spin, Popover, Empty } from "antd";
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
  WarningOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";
import { useAvatar } from "@/components/providers/AvatarProvider";
import { paymentApi, dashboardApi, notificationApi } from "@/lib/api";
import type { PaymentStatus, UserNotification } from "@/types";
import { RouteLoader } from "@/components/common/RouteLoader";
import { timeAgo } from "@/utils/helpers";


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
  "/notifications": {
    icon: <BellOutlined />,
    label: "Notifications",
    permission: "",
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
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isDark, toggle } = useTheme();
  const { avatarUrl } = useAvatar();

  // Live access snapshot from the backend (refreshes when the session changes so
  // role/permission changes take effect instead of waiting for the 7-day session expiry).
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
  }, [session]);

  const loadNotifications = useCallback(async () => {
    if (!session?.user) return;
    setNotifLoading(true);
    try {
      const res = await notificationApi.mine(20);
      setNotifications(res.data?.data?.items || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch {
      // Polling errors are non-fatal; the next tick retries.
    } finally {
      setNotifLoading(false);
    }
  }, [session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial bell load mirrors existing app pattern
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!session?.user) return;
    const id = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(id);
  }, [session, loadNotifications]);

  const handleNotifOpen = (open: boolean) => {
    setNotifOpen(open);
    if (open) loadNotifications();
  };

  const markNotificationRead = async (item: UserNotification) => {
    if (item.readAt) return;
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, readAt: now } : n)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await notificationApi.markRead({ ids: [item.id] });
    } catch {
      loadNotifications();
    }
  };

  const markAllNotificationsRead = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: now })),
    );
    setUnreadCount(0);
    try {
      await notificationApi.markRead({ all: true });
    } catch {
      loadNotifications();
    }
  };

  const [permissionsError, setPermissionsError] = useState(false);
  const [permissionsRetry, setPermissionsRetry] = useState(0);

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
        setPermissionsError(false);
      })
      .catch(() => {
        if (!active) return;
        setLiveAccess(null);
        setPermissionsError(true);
      });
    return () => {
      active = false;
    };
  }, [session, permissionsRetry]);

  const user = session?.user;

  const permissions = liveAccess?.permissions;
  const showUpgrade = liveAccess?.needsUpgrade ?? false;
  const menuReady = liveAccess !== null;

  const menuItems = useMemo(() => {
    if (!permissions) return [];
    return Object.entries(routeMap)
      .filter(([key, item]) => {
        if (key === "/upgrade") return showUpgrade;
        if (key === "/notifications") {
          return (liveAccess?.role || "").toUpperCase() === "ADMIN";
        }
        return item.permission === "" || permissions.includes(item.permission);
      })
      .map(([key, item]) => ({
        key,
        icon: item.icon,
        label: item.label,
      }));
  }, [permissions, showUpgrade, liveAccess?.role]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    router.push("/login");
  };

  const notificationContent = (
    <div style={{ width: 340, maxWidth: "82vw" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "2px 4px 8px",
        }}
      >
        <Typography.Text strong>Notifications</Typography.Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" style={{ padding: 0 }} onClick={markAllNotificationsRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {notifLoading && notifications.length === 0 ? (
          <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications yet"
            style={{ margin: "16px 0" }}
          />
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationRead(item)}
              style={{
                display: "flex",
                gap: 8,
                padding: "10px 6px",
                borderTop: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f5",
                cursor: item.readAt ? "default" : "pointer",
                background: item.readAt ? "transparent" : isDark ? "rgba(79,70,229,0.14)" : "rgba(79,70,229,0.05)",
                borderRadius: 6,
              }}
            >
              {!item.readAt && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#4f46e5",
                    marginTop: 6,
                    flex: "none",
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong={!item.readAt} style={{ display: "block" }}>
                  {item.title}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", fontSize: 12, whiteSpace: "pre-wrap" }}
                >
                  {item.body}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {timeAgo(item.createdAt)}
                </Typography.Text>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
        {permissionsError ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 12px",
            }}
          >
            <Button
              size="small"
              onClick={() => setPermissionsRetry((r) => r + 1)}
              style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}
            >
              Failed to load permissions — Retry
            </Button>
          </div>
        ) : menuReady ? (
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
            <Popover
              content={notificationContent}
              trigger="click"
              open={notifOpen}
              onOpenChange={handleNotifOpen}
              placement="bottomRight"
              arrow={false}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{
                    fontSize: 16,
                    color: isDark ? "#a0a0b0" : "#6e6e73",
                  }}
                  title="Notifications"
                />
              </Badge>
            </Popover>
            {paymentStatus && !paymentStatus.isActive && paymentStatus.currentSubscription?.plan && paymentStatus.currentSubscription.plan.name !== "FREE" && (
              <Badge dot>
                <Button
                  type="text"
                  icon={<WarningOutlined />}
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
