"use client";

import { Card } from "antd";
import { useTheme } from "@/components/providers/AntdProvider";

interface SectionCardProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

export function SectionCard({ title, extra, children, noPadding, style }: SectionCardProps) {
  const { isDark } = useTheme();

  return (
    <Card
      title={title}
      extra={extra}
      bordered={false}
      style={{
        borderRadius: 12,
        border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
        ...style,
      }}
      bodyStyle={noPadding ? { padding: 0 } : undefined}
    >
      {children}
    </Card>
  );
}
