"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, Button, Spin, Result, Space, Tag, Divider, Row, Col, message } from "antd";
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, CrownOutlined, ThunderboltOutlined, RocketOutlined, LockOutlined, StopOutlined } from "@ant-design/icons";
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
  if (days < 1/24) {
    const minutes = Math.round(days * 24 * 60);
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  } else if (days < 1) {
    const hours = Math.round(days * 24);
    return hours === 1 ? "1 hour" : `${hours} hours`;
  } else if (days === 1) {
    return "1 day";
  } else if (days === 30) {
    return "1 month";
  } else if (days === 365) {
    return "1 year";
  } else {
    return `${days} days`;
  }
}

export default function RenewPage() {
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
      Promise.all([
        paymentApi.plans(),
        paymentApi.status(),
      ]).then(([plansRes, statusRes]) => {
        setPlans(plansRes.data?.data || []);
        setPaymentStatus(statusRes.data?.data || null);
      }).catch(() => {}).finally(() => setLoading(false));
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
      setProcessing(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5", padding: 24 }}>
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Result
            status="error"
            title="Unable to load payment status"
            subTitle="Please try again later or contact support."
            extra={
              <Button type="primary" onClick={() => router.push("/profile")}>
                Back to Profile
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const currentPlan = paymentStatus.currentSubscription?.plan;
  const currentPlanLevel = currentPlan ? (PLAN_LEVEL[currentPlan.name] ?? 0) : -1;
  const isActive = paymentStatus.isActive;

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: isDark ? "#0a0a1e" : "#f0f2f5", padding: 24 }}>
      {contextHolder}
      <Card style={{ maxWidth: 900, width: "100%", borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff", border: isDark ? "1px solid #2e2e40" : undefined }}>
        <Typography.Title level={2} style={{ textAlign: "center", marginBottom: 8 }}>
          <CrownOutlined style={{ color: "#faad14", marginRight: 8 }} />
          Renew NFC Service
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 24 }}>
          Choose a plan to keep your NFC service active
        </Typography.Paragraph>

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={4}>Current Status</Typography.Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography.Text>Status:</Typography.Text>
              {isActive ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
              ) : (
                <Tag color="error" icon={<StopOutlined />}>Expired</Tag>
              )}
            </div>
            {currentPlan && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography.Text>Current Plan:</Typography.Text>
                <Tag color={PLAN_COLORS[currentPlan.name] || "#4f46e5"}>{currentPlan.displayName}</Tag>
              </div>
            )}
            {paymentStatus.expiresAt && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography.Text>Expires:</Typography.Text>
                <Typography.Text>
                  {new Date(paymentStatus.expiresAt).toLocaleDateString()}
                </Typography.Text>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography.Text>Days Remaining:</Typography.Text>
              <Typography.Text strong>
                {paymentStatus.daysRemaining} days
              </Typography.Text>
            </div>
          </Space>
        </div>

        <Divider />

        <Typography.Title level={4} style={{ textAlign: "center", marginBottom: 16 }}>Available Plans</Typography.Title>

        <Row gutter={[16, 16]}>
          {plans.map((plan) => {
            const planLevel = PLAN_LEVEL[plan.name] ?? 0;
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isLowerOrSame = planLevel <= currentPlanLevel;
            const isBlocked = isLowerOrSame && !isCurrentPlan;
            const isFree = plan.price === 0;
            const color = PLAN_COLORS[plan.name] || "#4f46e5";

            let buttonText: string;
            let buttonDisabled: boolean;

            if (isCurrentPlan) {
              buttonText = "Current";
              buttonDisabled = true;
            } else if (isBlocked) {
              buttonText = "Blocked";
              buttonDisabled = true;
            } else if (isFree) {
              buttonText = "Select Free";
              buttonDisabled = false;
            } else {
              buttonText = `Pay $${plan.price.toFixed(2)}`;
              buttonDisabled = false;
            }

            return (
              <Col xs={24} sm={8} key={plan.id}>
                <Card
                  style={{
                    borderRadius: 12,
                    height: "100%",
                    background: isDark ? "#252536" : "#fafafa",
                    border: isCurrentPlan ? `2px solid ${color}` : isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
                    textAlign: "center",
                    opacity: isBlocked ? 0.6 : 1,
                    position: "relative",
                  }}
                >
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
                  <div style={{ fontSize: 28, color, marginBottom: 8 }}>
                    {PLAN_ICONS[plan.name] || <CrownOutlined />}
                  </div>
                  <Typography.Title level={4} style={{ margin: 0 }}>{plan.displayName}</Typography.Title>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                    {formatDuration(plan.durationDays)}
                  </Typography.Text>
                  <Typography.Title level={2} style={{ color, margin: "8px 0" }}>
                    ${plan.price.toFixed(2)}
                  </Typography.Title>
                  <Button
                    type={isCurrentPlan ? "default" : "primary"}
                    block
                    disabled={buttonDisabled}
                    loading={processing === plan.id && !buttonDisabled}
                    onClick={() => handleSelectPlan(plan)}
                    icon={isBlocked ? <LockOutlined /> : undefined}
                    style={{
                      borderRadius: 8,
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

        <Divider />

        <Typography.Paragraph type="secondary" style={{ textAlign: "center", fontSize: 12, marginBottom: 0 }}>
          Payment is processed securely through PayPal.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
