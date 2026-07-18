"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Flex, Spin, Input, Button, Typography, Space, Card, Result } from "antd";
import { SearchOutlined, LockOutlined, DollarOutlined } from "@ant-design/icons";
import { sharingApi, paymentApi } from "@/lib/api";
import VipTemplate from "@/components/templates/VipTemplate";
import UserTemplate from "@/components/templates/UserTemplate";
import type { PaymentStatus } from "@/types";

export default function PublicUserPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [data, setData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setPaymentStatus(null);
    try {
      const [profileRes, paymentRes] = await Promise.all([
        sharingApi.publicByUser(id.trim()),
        paymentApi.publicStatus(id.trim()),
      ]);
      const profile = profileRes.data?.data;
      const payment = paymentRes.data?.data;
      if (profile) {
        setData(profile);
        if (payment) {
          setPaymentStatus(payment);
        }
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get("userId");
    if (paramId) {
      setUserId(paramId);
      fetchProfile(paramId);
    }
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "100vh", background: "#f0f2f5" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (data) {
    // Check if user is eligible (active and not expired)
    if (paymentStatus && !paymentStatus.isActive) {
      return (
        <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Card style={{ maxWidth: 500, width: "100%" }}>
            <Result
              icon={<LockOutlined style={{ color: "#faad14" }} />}
              title="NFC Service Expired"
              subTitle={
                paymentStatus.status === "DISABLED"
                  ? "This NFC service has been disabled. Please contact the owner to renew."
                  : paymentStatus.daysRemaining <= 0
                  ? "This NFC service has expired. Please login to renew your service."
                  : `This NFC service will expire in ${paymentStatus.daysRemaining} days.`
              }
              extra={
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => router.push("/renew")}
                  size="large"
                >
                  Renew NFC Service - $2/year
                </Button>
              }
            />
          </Card>
        </div>
      );
    }

    const role = data.role?.name || data.user?.role?.name || "USER";
    if (role === "VIP") {
      return <VipTemplate user={data} items={data.sharingContent || []} />;
    }
    return <UserTemplate user={data} items={data.sharingContent || []} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>NFC Tap Profile</Typography.Title>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          Enter a user ID to view their profile
        </Typography.Text>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onPressEnter={() => fetchProfile(userId)}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => fetchProfile(userId)}
            loading={loading}
          >
            View
          </Button>
        </Space.Compact>
        {error && (
          <Typography.Text type="danger" style={{ display: "block", marginTop: 12 }}>
            {error}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}
