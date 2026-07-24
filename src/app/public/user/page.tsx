"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Flex, Spin, Input, Button, Typography, Space, Card, Result } from "antd";
import { SearchOutlined, LockOutlined, WarningOutlined } from "@ant-design/icons";
import { sharingApi } from "@/lib/api";
import VipTemplate from "@/components/templates/VipTemplate";
import UserTemplate from "@/components/templates/UserTemplate";

function PublicUserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const profileRes = await sharingApi.publicByUser(id.trim());
      const profile = profileRes.data?.data;
      
      if (profile) {
        setData(profile);
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === "NFC_EXPIRED") {
        setError("NFC_EXPIRED");
      } else {
        router.replace("/");
      }
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

  if (error === "NFC_EXPIRED") {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f2f5", display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Result
            icon={<LockOutlined style={{ color: "#faad14" }} />}
            title="NFC Service Expired"
            subTitle="This NFC service has expired or been disabled. The owner needs to login and renew the service."
            extra={
              <Button
                type="primary"
                icon={<WarningOutlined />}
                disabled
                size="large"
              >
                Service Unavailable
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (data) {
    const role = data.role?.name || "USER";
    const subStatus = data.subscription?.status;
    const subPlan = data.subscription?.plan?.name;

    if (role === "VIP" && subStatus === "ACTIVE") {
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

export default function PublicUserPage() {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <PublicUserContent />
    </Suspense>
  );
}
