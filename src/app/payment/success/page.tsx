"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Result, Button, Spin, Typography } from "antd";
import { paymentApi } from "@/lib/api";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{ name: string; duration: string } | null>(null);

  function formatDuration(days: number): string {
    if (days === 0) return "30 minutes";
    if (days <= 1) return "1 day";
    if (days === 30) return "1 month";
    if (days === 365) return "1 year";
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`;
  }

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
          const subscription = res.data?.data?.subscription;
          if (subscription?.plan) {
            setPlanInfo({
              name: subscription.plan.displayName || subscription.plan.name,
              duration: formatDuration(subscription.plan.durationDays),
            });
          }
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
    const message = planInfo
      ? `Your NFC service has been renewed with the ${planInfo.name} plan for ${planInfo.duration}. You can now continue using all features.`
      : "Your NFC service has been renewed successfully. You can now continue using all features.";

    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5", padding: 24 }}>
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Result
            status="success"
            title="Payment Successful!"
            subTitle={message}
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
