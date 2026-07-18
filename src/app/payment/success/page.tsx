"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Result, Button, Spin, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { paymentApi } from "@/lib/api";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const capturePayment = async () => {
      const token = searchParams.get("token");
      const payerId = searchParams.get("PayerID");

      if (!token) {
        setError("No payment token found");
        setLoading(false);
        return;
      }

      try {
        const res = await paymentApi.capture(token, payerId || undefined);
        if (res.data?.success) {
          setSuccess(true);
        } else {
          setError(res.data?.message || "Payment capture failed");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Payment capture failed");
      } finally {
        setLoading(false);
      }
    };

    capturePayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5" }}>
        <Card style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <Spin size="large" />
          <Typography.Paragraph style={{ marginTop: 16 }}>
            Processing your payment...
          </Typography.Paragraph>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5", padding: 24 }}>
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Result
            status="success"
            title="Payment Successful!"
            subTitle="Your NFC service has been renewed for 1 year. You can now continue using all features."
            extra={[
              <Button type="primary" key="profile" onClick={() => router.push("/profile")}>
                Go to Profile
              </Button>,
              <Button key="home" onClick={() => router.push("/")}>
                Back to Home
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5", padding: 24 }}>
      <Card style={{ maxWidth: 500, width: "100%" }}>
        <Result
          status="error"
          title="Payment Failed"
          subTitle={error || "Something went wrong. Please try again."}
          extra={[
            <Button type="primary" key="renew" onClick={() => router.push("/renew")}>
              Try Again
            </Button>,
            <Button key="profile" onClick={() => router.push("/profile")}>
              Back to Profile
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
