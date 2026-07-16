"use client";

import { Typography, Breadcrumb } from "antd";

interface Props {
  title: string;
  breadcrumb?: { label: string; path?: string }[];
}

export function PageHeader({ title, breadcrumb }: Props) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumb && (
        <Breadcrumb
          items={breadcrumb.map((item) => ({
            title: item.path ? <a href={item.path}>{item.label}</a> : item.label,
          }))}
          style={{ marginBottom: 8 }}
        />
      )}
      <Typography.Title level={4} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
    </div>
  );
}
