"use client";

import { useRouter } from "next/navigation";
import { Card, Result, Button } from "antd";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f0f2f5", padding: 24 }}>
      <Card style={{ maxWidth: 500, width: "100%" }}>
        <Result
          status="warning"
          title="Payment Cancelled"
          subTitle="Your payment was cancelled. Your NFC service remains in its current state."
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
