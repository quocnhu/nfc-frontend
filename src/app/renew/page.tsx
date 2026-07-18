"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, Button, Spin, Result, Space, Tag, Divider } from "antd";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { paymentApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import type { PaymentStatus } from "@/types";

export default function RenewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPaymentStatus();
    }
  }, [status, router]);

  const fetchPaymentStatus = async () => {
    try {
      const res = await paymentApi.status();
      if (res.data?.data) {
        setPaymentStatus(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setProcessing(true);
      const res = await paymentApi.createOrder();
      const approveUrl = res.data?.data?.approveUrl;
      if (approveUrl) {
        window.location.href = approveUrl;
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      setProcessing(false);
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5", padding: 24 }}>
      <Card style={{ maxWidth: 600, width: "100%" }}>
        <Typography.Title level={2} style={{ textAlign: "center", marginBottom: 8 }}>
          Renew NFC Service
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 24 }}>
          Keep your NFC service active and continue sharing your profile
        </Typography.Paragraph>

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={4}>Current Status</Typography.Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography.Text>Status:</Typography.Text>
              {paymentStatus.isActive ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
              ) : (
                <Tag color="error" icon={<ClockCircleOutlined />}>Expired</Tag>
              )}
            </div>
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

        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={4}>Renewal Plan</Typography.Title>
          <Card
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              color: "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Typography.Title level={3} style={{ color: "white", margin: 0 }}>
                  1 Year Activation
                </Typography.Title>
                <Typography.Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Full access to NFC sharing features
                </Typography.Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Typography.Title level={2} style={{ color: "white", margin: 0 }}>
                  $2.00
                </Typography.Title>
                <Typography.Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  per year
                </Typography.Text>
              </div>
            </div>
          </Card>
        </div>

        <Divider />

        <div style={{ textAlign: "center" }}>
          {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID.startsWith("your-paypal") ? (
            <>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Click the button below to proceed with PayPal payment
              </Typography.Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<DollarOutlined />}
                onClick={handleCreateOrder}
                loading={processing}
                style={{
                  height: 50,
                  fontSize: 16,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Pay with PayPal - $2.00
              </Button>
            </>
          ) : (
            <div style={{ padding: 24, background: "#fff7e6", borderRadius: 8, border: "1px solid #ffd591" }}>
              <Typography.Title level={5} style={{ color: "#d46b08", marginTop: 0 }}>
                PayPal Not Configured
              </Typography.Title>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Please configure PayPal credentials in your environment variables to enable payments.
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Set NEXT_PUBLIC_PAYPAL_CLIENT_ID in .env.local
                </Typography.Text>
              </Typography.Paragraph>
            </div>
          )}
        </div>

        <Divider />

        <Typography.Paragraph type="secondary" style={{ textAlign: "center", fontSize: 12, marginBottom: 0 }}>
          By proceeding, you agree to our terms of service. Payment is processed securely through PayPal.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
