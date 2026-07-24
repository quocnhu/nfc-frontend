"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, Button, Spin, Space, Tag, Divider, Row, Col, message, Empty } from "antd";
import { CrownOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, RocketOutlined, LockOutlined, StopOutlined } from "@ant-design/icons";
import { paymentApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";
import type { Plan, PaymentStatus } from "@/types";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <ClockCircleOutlined />,
  PRO: <ThunderboltOutlined />,
  PROPLUS: <RocketOutlined />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6e6e73",
  PRO: "#4f46e5",
  PROPLUS: "#faad14",
};

const PLAN_LEVEL: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  PROPLUS: 2,
};

function formatDuration(days: number): string {
  if (days === 0) return "30 minutes";
  if (days <= 1) return "30 minutes";
  if (days <= 30) return "1 month";
  if (days <= 365) return "1 year";
  return `${days} days`;
}

export default function UpgradePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isDark } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          const [plansRes, statusRes] = await Promise.allSettled([
            paymentApi.plans(),
            paymentApi.status(),
          ]);

          if (plansRes.status === "fulfilled") {
            setPlans(plansRes.value.data?.data || []);
          }

          if (statusRes.status === "fulfilled") {
            setPaymentStatus(statusRes.value.data?.data || null);
          }
        } catch (err) {
          console.error("Failed to fetch data:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [status, router]);

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setProcessing(plan.id);
      const res = await paymentApi.createOrder(plan.id);
      if (plan.price === 0) {
        if (res.data?.success) {
          messageApi.success("Free plan activated!");
          setTimeout(() => router.push("/profile"), 1000);
        }
      } else {
        const approveUrl = res.data?.data?.approveUrl;
        if (approveUrl) {
          window.location.href = approveUrl;
        }
      }
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to activate plan");
    } finally {
      setProcessing(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentPlan = paymentStatus?.currentSubscription?.plan;
  const currentPlanLevel = currentPlan ? (PLAN_LEVEL[currentPlan.name] ?? 0) : -1;
  const isActive = paymentStatus?.isActive || false;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {contextHolder}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <CrownOutlined style={{ fontSize: 40, color: "#faad14", marginBottom: 12 }} />
        <Typography.Title level={2} style={{ margin: 0 }}>
          Upgrade Your Plan
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 15 }}>
          Choose the plan that fits your needs
        </Typography.Text>
      </div>

      {currentPlan ? (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            background: isActive
              ? (isDark ? "#1e1e2e" : "#f6ffed")
              : (isDark ? "#1e1e2e" : "#fff2f0"),
            border: isActive
              ? `1px solid ${isDark ? "#2e2e40" : "#b7eb8f"}`
              : `1px solid ${isDark ? "#2e2e40" : "#ffa39e"}`,
          }}
        >
          <Space>
            {isActive ? (
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            ) : (
              <StopOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
            )}
            <Typography.Text>
              Current plan: <Tag color={PLAN_COLORS[currentPlan.name] || "#4f46e5"}>{currentPlan.displayName}</Tag>
              {isActive ? (
                paymentStatus?.expiresAt && (
                  <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                    Expires {new Date(paymentStatus.expiresAt).toLocaleDateString()} ({paymentStatus.daysRemaining} days remaining)
                  </Typography.Text>
                )
              ) : (
                <Typography.Text type="danger" style={{ marginLeft: 8 }}>
                  Subscription expired
                </Typography.Text>
              )}
            </Typography.Text>
          </Space>
        </Card>
      ) : (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            background: isDark ? "#1e1e2e" : "#fff7e6",
            border: `1px solid ${isDark ? "#2e2e40" : "#ffd591"}`,
          }}
        >
          <Space>
            <ClockCircleOutlined style={{ color: "#faad14", fontSize: 18 }} />
            <Typography.Text>
              <Typography.Text strong>No active plan</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                Select a plan to get started
              </Typography.Text>
            </Typography.Text>
          </Space>
        </Card>
      )}

      {plans.length === 0 ? (
        <Empty description="No plans available" />
      ) : (
        <Row gutter={[20, 20]}>
          {plans.map((plan) => {
            const planLevel = PLAN_LEVEL[plan.name] ?? 0;
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isLowerOrSame = planLevel <= currentPlanLevel;
            const isBlocked = isLowerOrSame && !isCurrentPlan;
            const isFree = plan.price === 0;
            const color = PLAN_COLORS[plan.name] || "#4f46e5";

            let buttonText: string;
            let buttonDisabled: boolean;
            let buttonType: "primary" | "default" = "primary";

            if (isCurrentPlan) {
              buttonText = "Current Plan";
              buttonDisabled = true;
              buttonType = "default";
            } else if (isBlocked) {
              buttonText = "Blocked";
              buttonDisabled = true;
            } else if (isFree) {
              buttonText = "Start Free Trial";
              buttonDisabled = false;
            } else {
              buttonText = `Pay $${plan.price.toFixed(2)}`;
              buttonDisabled = false;
            }

            return (
              <Col xs={24} sm={24} md={8} key={plan.id}>
                <Card
                  style={{
                    borderRadius: 16,
                    height: "100%",
                    background: isDark ? "#1e1e2e" : "#ffffff",
                    border: isCurrentPlan
                      ? `2px solid ${color}`
                      : isBlocked
                        ? isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0"
                        : isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
                    boxShadow: isCurrentPlan ? `0 4px 20px ${color}22` : "none",
                    position: "relative",
                    overflow: "hidden",
                    opacity: isBlocked ? 0.6 : 1,
                  }}
                  styles={{ body: { display: "flex", flexDirection: "column", height: "100%" } }}
                >
                  {isCurrentPlan && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: -28,
                      background: color,
                      color: "#fff",
                      padding: "2px 32px",
                      fontSize: 11,
                      fontWeight: 600,
                      transform: "rotate(45deg)",
                    }}>
                      CURRENT
                    </div>
                  )}
                  {isBlocked && (
                    <div style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: isDark ? "#333" : "#f0f0f0",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <LockOutlined style={{ color: isDark ? "#666" : "#999", fontSize: 14 }} />
                    </div>
                  )}

                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: `${color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      color,
                      margin: "0 auto 12px",
                    }}>
                      {PLAN_ICONS[plan.name] || <CrownOutlined />}
                    </div>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {plan.displayName}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {plan.description}
                    </Typography.Text>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <Typography.Title level={1} style={{ margin: 0, color }}>
                      ${plan.price.toFixed(2)}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {formatDuration(plan.durationDays)}
                    </Typography.Text>
                  </div>

                  <div style={{ flex: 1, marginBottom: 20 }}>
                    <Space direction="vertical" style={{ width: "100%" }} size={8}>
                      {!isFree && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Typography.Text style={{ fontSize: 13 }}>Full NFC access</Typography.Text>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Typography.Text style={{ fontSize: 13 }}>Custom sharing links</Typography.Text>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Typography.Text style={{ fontSize: 13 }}>Priority support</Typography.Text>
                          </div>
                        </>
                      )}
                      {isFree && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Typography.Text style={{ fontSize: 13 }}>30 minutes NFC access</Typography.Text>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                            <Typography.Text style={{ fontSize: 13 }}>Basic sharing links</Typography.Text>
                          </div>
                        </>
                      )}
                    </Space>
                  </div>

                  <Button
                    type={buttonType}
                    block
                    size="large"
                    disabled={buttonDisabled}
                    loading={processing === plan.id && !buttonDisabled}
                    onClick={() => handleSelectPlan(plan)}
                    icon={isBlocked ? <LockOutlined /> : undefined}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontWeight: 600,
                      ...(!buttonDisabled && !isCurrentPlan && !isFree ? {
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        border: "none",
                      } : {}),
                    }}
                  >
                    {buttonText}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Divider />

      <Typography.Paragraph type="secondary" style={{ textAlign: "center", fontSize: 12, marginBottom: 0 }}>
        Payment is processed securely through PayPal. You can upgrade your plan at any time.
      </Typography.Paragraph>
    </div>
  );
}
