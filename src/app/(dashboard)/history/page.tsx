"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Tooltip, message } from "antd";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { historyApi } from "@/lib/api";
import { extractApiError } from "@/lib/api-error";
import { formatDateTime } from "@/utils/helpers";
import type { History } from "@/types";

const ACTION_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  create: { color: "green", icon: <PlusCircleOutlined />, label: "Created" },
  update: { color: "blue", icon: <EditOutlined />, label: "Updated" },
  delete: { color: "red", icon: <DeleteOutlined />, label: "Deleted" },
  read: { color: "default", icon: <EyeOutlined />, label: "Viewed" },
};

function parseAction(action: string) {
  const [verb, resource] = action.split(":");
  const config = ACTION_CONFIG[verb] || { color: "default", icon: null, label: verb };
  return { verb, resource, ...config };
}

function formatResourceName(resource?: string): string {
  if (!resource) return "System";
  const map: Record<string, string> = {
    user: "User",
    role: "Role",
    permission: "Permission",
    "sharing-content": "Sharing Content",
    auth: "Auth",
    dashboard: "Dashboard",
    history: "History",
  };
  return map[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
}

export default function HistoryPage() {
  const [items, setItems] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });

  useEffect(() => {
    historyApi
      .list()
      .then((res) => setItems(res.data?.data || []))
      .catch((err) => {
        setItems([]);
        message.error(extractApiError(err, "Failed to load history"));
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: "#", key: "index", width: 60, render: (_: any, __: any, i: number) => (pagination.current - 1) * pagination.pageSize + i + 1 },
    {
      title: "User",
      key: "user",
      filterSearch: true,
      filters: [...new Set(items.map((i) => i.user?.fullname).filter(Boolean))].map((n) => ({ text: n!, value: n! })),
      onFilter: (value: any, record: History) => (record.user?.fullname || "").includes(value),
      render: (_: any, record: History) => (
        <span>{record.user?.fullname || "System"}</span>
      ),
    },
    {
      title: "Action",
      key: "action",
      filters: Object.entries(ACTION_CONFIG).map(([key, cfg]) => ({ text: cfg.label, value: key })),
      onFilter: (value: any, record: History) => record.action.split(":")[0] === value,
      render: (_: any, record: History) => {
        const { color, icon, label } = parseAction(record.action);
        return <Tag color={color} icon={icon}>{label}</Tag>;
      },
    },
    {
      title: "Resource",
      key: "resource",
      filters: [...new Set(items.map((i) => parseAction(i.action).resource).filter(Boolean))].map((r) => ({ text: formatResourceName(r), value: r! })),
      onFilter: (value: any, record: History) => parseAction(record.action).resource === value,
      render: (_: any, record: History) => {
        const { resource } = parseAction(record.action);
        return <Tag>{formatResourceName(resource)}</Tag>;
      },
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      ellipsis: true,
    },
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (ts: string) => (
        <Tooltip title={ts}>
          <span><ClockCircleOutlined /> {formatDateTime(ts)}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Table loading={loading} columns={columns} dataSource={items} rowKey="id" scroll={{ x: "max-content" }} pagination={{ current: pagination.current, pageSize: pagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} items`, onChange: (page, size) => setPagination({ current: page, pageSize: size }) }} />
    </>
  );
}
