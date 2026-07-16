"use client";

import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  List,
  Tag,
  Typography,
  Avatar,
  Tooltip,
  Button,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { dashboardApi } from "@/lib/api";
import { formatDateTime } from "@/utils/helpers";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";
import type { DashboardStats, History } from "@/types";

const ACTION_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  create: { color: "green", icon: <PlusCircleOutlined />, label: "Created" },
  update: { color: "blue", icon: <EditOutlined />, label: "Updated" },
  delete: { color: "red", icon: <DeleteOutlined />, label: "Deleted" },
  read: { color: "default", icon: <EyeOutlined />, label: "Viewed" },
};

function parseAction(action: string) {
  const [verb, resource] = action.split(":");
  const config = ACTION_CONFIG[verb] || {
    color: "default",
    icon: null,
    label: verb,
  };
  return { verb, resource, ...config };
}

function formatResourceName(resource?: string): string {
  if (!resource) return "System";
  const map: Record<string, string> = {
    user: "User",
    role: "Role",
    permission: "Permission",
    "sharing-content": "Sharing Content",
    auth: "Auth",
    dashboard: "Dashboard",
    history: "History",
    roles: "Role",
    users: "User",
    permissions: "Permission",
    "sharing-contents": "Sharing Content",
  };
  return (
    map[resource] ||
    resource.charAt(0).toUpperCase() + resource.slice(1)
  );
}

const STAT_CARDS = [
  {
    key: "users",
    title: "Users",
    icon: <UserOutlined />,
    field: "totalUsers" as const,
    color: "#4f46e5",
    bgColor: "rgba(79, 70, 229, 0.08)",
  },
  {
    key: "roles",
    title: "Roles",
    icon: <TeamOutlined />,
    field: "totalRoles" as const,
    color: "#0ea5e9",
    bgColor: "rgba(14, 165, 233, 0.08)",
  },
  {
    key: "permissions",
    title: "Permissions",
    icon: <SafetyOutlined />,
    field: "totalPermissions" as const,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.08)",
  },
  {
    key: "sharing",
    title: "Sharing",
    icon: <ShareAltOutlined />,
    field: "totalSharingContent" as const,
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.08)",
  },
  {
    key: "history",
    title: "History",
    icon: <HistoryOutlined />,
    field: "totalHistories" as const,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.08)",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<History[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.activity(20),
      ]);
      setStats(statsRes.data?.data || null);
      setActivity(activityRes.data?.data || []);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Row gutter={[16, 16]}>
        {STAT_CARDS.map((card) => (
          <Col xs={12} sm={8} lg={4} xl={4} key={card.key}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                background: isDark ? "#1e1e2e" : "#ffffff",
                border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: card.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: isDark ? "#a0a0b0" : "#6e6e73",
                      marginBottom: 2,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: isDark ? "#e0e0e8" : "#1d1d1f",
                    }}
                  >
                    {stats?.[card.field] ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card
            title="Recent Activity"
            bordered={false}
            style={{
              borderRadius: 12,
              border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
            }}
            extra={
              <Button
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={() => load(true)}
                size="small"
              >
                Refresh
              </Button>
            }
            bodyStyle={{ padding: 0 }}
          >
            <List
              loading={initialLoading}
              dataSource={activity}
              renderItem={(item) => {
                const { verb, resource, color, icon, label } =
                  parseAction(item.action);
                return (
                  <List.Item
                    style={{
                      padding: "12px 16px",
                      borderBottom: isDark
                        ? "1px solid #2e2e40"
                        : "1px solid #f0f0f0",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={38}
                          style={{
                            backgroundColor:
                              color === "green"
                                ? "#10b981"
                                : color === "red"
                                ? "#ef4444"
                                : color === "blue"
                                ? "#4f46e5"
                                : isDark
                                ? "#2e2e40"
                                : "#e5e5ea",
                          }}
                          icon={icon}
                        />
                      }
                      title={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography.Text
                            strong
                            style={{ fontSize: 14 }}
                          >
                            {item.user?.fullname || "System"}
                          </Typography.Text>
                          <Tag color={color} style={{ margin: 0 }}>
                            {label}
                          </Tag>
                          <Tag style={{ margin: 0 }}>
                            {formatResourceName(resource)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          {item.details && (
                            <Typography.Text
                              style={{
                                fontSize: 13,
                                display: "block",
                                fontFamily: "monospace",
                                color: isDark ? "#a0a0b0" : "#6e6e73",
                                background: isDark ? "#252536" : "#f9f9fb",
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: isDark
                                  ? "1px solid #2e2e40"
                                  : "1px solid #f0f0f0",
                              }}
                            >
                              {item.details}
                            </Typography.Text>
                          )}
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <ClockCircleOutlined
                              style={{
                                color: isDark ? "#a0a0b0" : "#999",
                                fontSize: 12,
                              }}
                            />
                            <Tooltip title={item.timestamp}>
                              <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >
                                {formatDateTime(item.timestamp)}
                              </Typography.Text>
                            </Tooltip>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: "No recent activity" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title="Your Permissions"
            bordered={false}
            style={{
              borderRadius: 12,
              border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {user?.permissions?.map((p: string) => (
                <Tag
                  key={p}
                  style={{
                    borderRadius: 6,
                    padding: "2px 10px",
                    fontSize: 12,
                    border: isDark ? "1px solid #2e2e40" : undefined,
                  }}
                >
                  {p}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
