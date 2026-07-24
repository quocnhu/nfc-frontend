"use client";

import { useEffect, useState } from "react";
import { Row, Col, List, Tag, Typography, Avatar, Tooltip, Button, Badge, Radio, Spin, Card } from "antd";
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
  WarningOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { dashboardApi } from "@/lib/api";
import { formatDateTime } from "@/utils/helpers";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";
import { StatCard, SectionCard } from "@/components/ui";
import type { DashboardStats, History, SuspiciousActivity, SuspiciousAlert } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ACTION_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  create: { color: "green", icon: <PlusCircleOutlined />, label: "Created" },
  update: { color: "blue", icon: <EditOutlined />, label: "Updated" },
  delete: { color: "red", icon: <DeleteOutlined />, label: "Deleted" },
  read: { color: "default", icon: <EyeOutlined />, label: "Viewed" },
};

function parseAction(action: string) {
  const [verb, resource] = action.split(":");
  const config = ACTION_CONFIG[verb] || { color: "default", icon: null, label: verb };
  return { verb, resource, ...config };
}

function formatResourceName(resource?: string): string {
  if (!resource) return "System";
  const map: Record<string, string> = {
    user: "User", role: "Role", permission: "Permission",
    "sharing-content": "Sharing Content", auth: "Auth",
    dashboard: "Dashboard", history: "History",
    roles: "Role", users: "User", permissions: "Permission",
    "sharing-contents": "Sharing Content",
  };
  return map[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
}

const STAT_CARDS = [
  { key: "users", title: "Users", icon: <UserOutlined />, field: "totalUsers" as const, color: "#4f46e5" },
  { key: "roles", title: "Roles", icon: <TeamOutlined />, field: "totalRoles" as const, color: "#0ea5e9" },
  { key: "permissions", title: "Permissions", icon: <SafetyOutlined />, field: "totalPermissions" as const, color: "#f59e0b" },
  { key: "sharing", title: "Sharing", icon: <ShareAltOutlined />, field: "totalSharingContent" as const, color: "#10b981" },
  { key: "history", title: "History", icon: <HistoryOutlined />, field: "totalHistories" as const, color: "#8b5cf6" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<History[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousActivity | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<{ total: number; active: number; expired: number; trial: number } | null>(null);
  const [paymentStats, setPaymentStats] = useState<{ total: number; completed: number; revenue: number } | null>(null);
  const [growthData, setGrowthData] = useState<{ labels: string[]; subscriptionData: number[]; revenueData: number[] } | null>(null);
  const [subPeriod, setSubPeriod] = useState<string>("all");
  const [payPeriod, setPayPeriod] = useState<string>("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, activityRes, suspiciousRes, subRes, payRes, growthRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.activity(20),
        dashboardApi.suspicious().catch(() => null),
        dashboardApi.subscriptionStats(),
        dashboardApi.paymentStats(),
        dashboardApi.growth(),
      ]);
      setStats(statsRes.data?.data || null);
      setActivity(activityRes.data?.data || []);
      setSuspicious(suspiciousRes?.data?.data || null);
      setSubscriptionStats(subRes.data?.data || null);
      setPaymentStats(payRes.data?.data || null);
      setGrowthData(growthRes.data?.data || null);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  const loadSubscriptionStats = async (period: string) => {
    try {
      const res = await dashboardApi.subscriptionStats(period === "all" ? undefined : period);
      setSubscriptionStats(res.data?.data || null);
    } catch {}
  };

  const loadPaymentStats = async (period: string) => {
    try {
      const res = await dashboardApi.paymentStats(period === "all" ? undefined : period);
      setPaymentStats(res.data?.data || null);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSubPeriodChange = (value: string) => {
    setSubPeriod(value);
    loadSubscriptionStats(value);
  };

  const handlePayPeriodChange = (value: string) => {
    setPayPeriod(value);
    loadPaymentStats(value);
  };

  const chartData = growthData?.labels.map((label, index) => ({
    month: label,
    subscriptions: growthData.subscriptionData[index],
    revenue: growthData.revenueData[index],
  })) || [];

  return (
    <>
      <Row gutter={[16, 16]}>
        {STAT_CARDS.map((card) => (
          <Col xs={12} sm={8} md={6} lg={4} xl={4} key={card.key}>
            <StatCard
              icon={card.icon}
              label={card.title}
              value={stats?.[card.field] ?? 0}
              color={card.color}
            />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <SectionCard
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CrownOutlined style={{ color: "#4f46e5" }} />
                <span>Subscriptions</span>
              </div>
            }
            extra={
              <Radio.Group
                size="small"
                value={subPeriod}
                onChange={(e) => handleSubPeriodChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="day">Today</Radio.Button>
                <Radio.Button value="week">Week</Radio.Button>
                <Radio.Button value="month">Month</Radio.Button>
                <Radio.Button value="year">Year</Radio.Button>
              </Radio.Group>
            }
          >
            {subscriptionStats ? (
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#4f46e5" }}>
                      {subscriptionStats.total}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Total</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
                      {subscriptionStats.active}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Active</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>
                      {subscriptionStats.trial}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Trial</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>
                      {subscriptionStats.expired}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Expired</div>
                  </div>
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
            )}
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DollarOutlined style={{ color: "#10b981" }} />
                <span>Payments</span>
              </div>
            }
            extra={
              <Radio.Group
                size="small"
                value={payPeriod}
                onChange={(e) => handlePayPeriodChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="day">Today</Radio.Button>
                <Radio.Button value="week">Week</Radio.Button>
                <Radio.Button value="month">Month</Radio.Button>
                <Radio.Button value="year">Year</Radio.Button>
              </Radio.Group>
            }
          >
            {paymentStats ? (
              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#4f46e5" }}>
                      {paymentStats.total}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Total</div>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
                      {paymentStats.completed}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Completed</div>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
                      ${paymentStats.revenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Revenue</div>
                  </div>
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
            )}
          </SectionCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <SectionCard title="Growth Overview (Last 12 Months)">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2e2e40" : "#f0f0f0"} />
                  <XAxis
                    dataKey="month"
                    stroke={isDark ? "#a0a0b0" : "#6e6e73"}
                    style={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={isDark ? "#a0a0b0" : "#6e6e73"}
                    style={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={isDark ? "#a0a0b0" : "#6e6e73"}
                    style={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1e1e2e" : "#fff",
                      border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="subscriptions"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ fill: "#4f46e5", r: 4 }}
                    name="Subscriptions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 48, color: isDark ? "#a0a0b0" : "#6e6e73" }}>
                No growth data available
              </div>
            )}
          </SectionCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <SectionCard
            title="Recent Activity"
            noPadding
            extra={
              <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => load(true)} size="small">
                Refresh
              </Button>
            }
          >
            <List
              loading={initialLoading}
              dataSource={activity}
              renderItem={(item) => {
                const { verb, resource, color, icon, label } = parseAction(item.action);
                return (
                  <List.Item
                    style={{
                      padding: "12px 16px",
                      borderBottom: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={38}
                          style={{
                            backgroundColor:
                              color === "green" ? "#10b981" : color === "red" ? "#ef4444"
                              : color === "blue" ? "#4f46e5" : isDark ? "#2e2e40" : "#e5e5ea",
                          }}
                          icon={icon}
                        />
                      }
                      title={
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <Typography.Text strong style={{ fontSize: 14 }}>
                            {item.user?.fullname || "System"}
                          </Typography.Text>
                          <Tag color={color} style={{ margin: 0 }}>{label}</Tag>
                          <Tag style={{ margin: 0 }}>{formatResourceName(resource)}</Tag>
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
                                border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
                              }}
                            >
                              {item.details}
                            </Typography.Text>
                          )}
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                            <ClockCircleOutlined style={{ color: isDark ? "#a0a0b0" : "#999", fontSize: 12 }} />
                            <Tooltip title={item.timestamp}>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
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
          </SectionCard>
        </Col>
        <Col xs={24} lg={9}>
          <SectionCard
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <WarningOutlined style={{ color: suspicious?.summary.alertsCount ? "#ef4444" : "#10b981" }} />
                <span>Suspicious Activity</span>
                {suspicious?.summary.alertsCount ? (
                  <Badge count={suspicious.summary.alertsCount} style={{ backgroundColor: "#ef4444" }} />
                ) : null}
              </div>
            }
            noPadding
            style={{ marginBottom: 16 }}
          >
            {suspicious && (
              <div style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: suspicious.summary.failedLoginsLastHour > 0 ? "#ef4444" : "#10b981" }}>
                      {suspicious.summary.failedLoginsLastHour}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Failed (1h)</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>
                      {suspicious.summary.successfulLoginsLastHour}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Success (1h)</div>
                  </div>
                </div>
                {suspicious.alerts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px 0", color: isDark ? "#a0a0b0" : "#6e6e73" }}>
                    <SafetyCertificateOutlined style={{ fontSize: 28, color: "#10b981", marginBottom: 8, display: "block" }} />
                    No suspicious activity detected
                  </div>
                ) : (
                  <List
                    dataSource={suspicious.alerts.slice(0, 5)}
                    renderItem={(alert: SuspiciousAlert) => (
                      <List.Item style={{ padding: "8px 16px", borderBottom: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0" }}>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              size={32}
                              style={{
                                backgroundColor: alert.severity === "high" ? "#ef4444" : alert.severity === "medium" ? "#f59e0b" : "#6b7280",
                              }}
                              icon={alert.type.includes("brute_force") ? <LockOutlined /> : alert.type === "permission_change" ? <SafetyOutlined /> : <DeleteOutlined />}
                            />
                          }
                          title={<Typography.Text style={{ fontSize: 13 }}>{alert.message}</Typography.Text>}
                          description={
                            <Tooltip title={alert.timestamp}>
                              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {formatDateTime(alert.timestamp)}
                              </Typography.Text>
                            </Tooltip>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
          </SectionCard>
          <SectionCard title="Your Permissions">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
          </SectionCard>
        </Col>
      </Row>
    </>
  );
}
