"use client";

import { Card, Typography, Tag, Divider, Row, Col } from "antd";
import {
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/AntdProvider";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#f5222d",
  VIP: "#faad14",
  USER: "#1677ff",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const { isDark } = useTheme();

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleColor = ROLE_COLORS[user?.role || ""] || "#4f46e5";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: isDark ? "#1e1e2e" : "#ffffff",
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            margin: "-24px -24px 0",
            padding: "40px 24px 56px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 60%, #f093fb 100%)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              fontSize: 48,
              opacity: 0.15,
              color: "#fff",
            }}
          >
            <IdcardOutlined />
          </div>
        </div>

        {/* Avatar overlapping banner */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: -48,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              boxShadow: `0 4px 20px ${roleColor}44`,
              border: `4px solid ${isDark ? "#1e1e2e" : "#ffffff"}`,
            }}
          >
            {initials}
          </div>

          <Typography.Title
            level={3}
            style={{ margin: "16px 0 4px", fontWeight: 700 }}
          >
            {user?.name || "Unknown"}
          </Typography.Title>

          <Tag
            color={roleColor}
            style={{
              fontSize: 13,
              padding: "2px 14px",
              borderRadius: 20,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {user?.role || "USER"}
          </Tag>
        </div>

        <Divider style={{ margin: "28px 0 20px" }} />

        {/* Info Rows */}
        <div style={{ padding: "0 8px" }}>
          <InfoRow
            icon={<UserOutlined style={{ fontSize: 18 }} />}
            label="Full Name"
            value={user?.name || "—"}
            isDark={isDark}
            iconBg="#4f46e5"
          />
          <InfoRow
            icon={<MailOutlined style={{ fontSize: 18 }} />}
            label="Email"
            value={user?.email || "—"}
            isDark={isDark}
            iconBg="#10b981"
          />
          <InfoRow
            icon={<SafetyOutlined style={{ fontSize: 18 }} />}
            label="Role"
            value={user?.role || "—"}
            isDark={isDark}
            iconBg={roleColor}
            isLast
          />
        </div>

        {/* Permissions */}
        {user?.permissions && user.permissions.length > 0 && (
          <>
            <Divider style={{ margin: "20px 0 16px" }} />
            <div style={{ padding: "0 8px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}
                >
                  Permissions
                </Typography.Text>
                <Tag color="purple" style={{ margin: 0, borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                  {user.permissions.length}
                </Tag>
              </div>
              <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                {user.permissions.map((p: string) => (
                  <Col key={p}>
                    <Tag
                      style={{
                        borderRadius: 8,
                        padding: "3px 12px",
                        fontSize: 12,
                        background: isDark ? "#252536" : "#f5f5f7",
                        border: isDark ? "1px solid #2e2e40" : "1px solid #e5e5ea",
                      }}
                    >
                      {p}
                    </Tag>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isDark,
  iconBg,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
  iconBg: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderBottom: isLast ? "none" : `1px solid ${isDark ? "#2e2e40" : "#f0f0f0"}`,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${iconBg}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconBg,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: isDark ? "#a0a0b0" : "#6e6e73", marginBottom: 2 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: isDark ? "#e0e0e8" : "#1d1d1f",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
