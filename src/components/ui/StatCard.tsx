"use client";

import { Card } from "antd";
import { useTheme } from "@/components/providers/AntdProvider";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
  bgColor?: string;
}

export function StatCard({ icon, label, value, color = "#4f46e5", bgColor }: StatCardProps) {
  const { isDark } = useTheme();
  const finalBgColor = bgColor || `${color}14`;

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        background: isDark ? "#1e1e2e" : "#ffffff",
        border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: finalBgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              color: isDark ? "#a0a0b0" : "#6e6e73",
              marginBottom: 2,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1,
              color: isDark ? "#e0e0e8" : "#1d1d1f",
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}
