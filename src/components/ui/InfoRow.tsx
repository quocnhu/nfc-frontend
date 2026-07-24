"use client";

import { useTheme } from "@/components/providers/AntdProvider";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  isLast?: boolean;
}

export function InfoRow({ icon, label, value, iconBg, isLast }: InfoRowProps) {
  const { isDark } = useTheme();

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
