"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Typography, Card, Space, Avatar } from "antd";
import { DollarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { paymentApi } from "@/lib/api";
import { formatDate } from "@/utils/helpers";
import type { Payment } from "@/types";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.allPayments();
      setPayments(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: "User",
      key: "user",
      render: (_: any, record: Payment) => (
        <Space>
          <Avatar size="small" src={record.user?.avatarUrl}>
            {record.user?.fullname?.charAt(0)}
          </Avatar>
          <div>
            <Typography.Text strong>{record.user?.fullname}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.user?.email}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: Payment) => (
        <Typography.Text strong style={{ color: "#52c41a" }}>
          ${amount.toFixed(2)} {record.currency}
        </Typography.Text>
      ),
    },
    {
      title: "Duration",
      dataIndex: "durationDays",
      key: "durationDays",
      render: (days: number) => {
        if (days < 1/24) {
          const minutes = Math.round(days * 24 * 60);
          return <Typography.Text>{minutes} {minutes === 1 ? 'minute' : 'minutes'}</Typography.Text>;
        } else if (days < 1) {
          const hours = Math.round(days * 24);
          return <Typography.Text>{hours} {hours === 1 ? 'hour' : 'hours'}</Typography.Text>;
        } else if (days === 1) {
          return <Typography.Text>1 day</Typography.Text>;
        } else if (days === 30) {
          return <Typography.Text>1 month</Typography.Text>;
        } else if (days === 365) {
          return <Typography.Text>1 year</Typography.Text>;
        } else {
          return <Typography.Text>{days} days</Typography.Text>;
        }
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Completed", value: "COMPLETED" },
        { text: "Pending", value: "PENDING" },
        { text: "Failed", value: "FAILED" },
        { text: "Refunded", value: "REFUNDED" },
      ],
      onFilter: (value: any, record: Payment) => record.status === value,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          COMPLETED: "success",
          PENDING: "processing",
          FAILED: "error",
          REFUNDED: "default",
        };
        const iconMap: Record<string, React.ReactNode> = {
          COMPLETED: <CheckCircleOutlined />,
          PENDING: <ClockCircleOutlined />,
          FAILED: <CloseCircleOutlined />,
          REFUNDED: <CloseCircleOutlined />,
        };
        return (
          <Tag color={colorMap[status]} icon={iconMap[status]}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Expires At",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (date: string) => (
        <Typography.Text>
          {new Date(date).toLocaleDateString()}
        </Typography.Text>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Typography.Text type="secondary">
          {formatDate(date)}
        </Typography.Text>
      ),
    },
  ];

  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <Typography.Text type="secondary">Total Payments</Typography.Text>
            <br />
            <Typography.Title level={3} style={{ margin: 0 }}>
              {payments.length}
            </Typography.Title>
          </div>
          <div>
            <Typography.Text type="secondary">Completed Payments</Typography.Text>
            <br />
            <Typography.Title level={3} style={{ margin: 0, color: "#52c41a" }}>
              {payments.filter((p) => p.status === "COMPLETED").length}
            </Typography.Title>
          </div>
          <div>
            <Typography.Text type="secondary">Total Revenue</Typography.Text>
            <br />
            <Typography.Title level={3} style={{ margin: 0, color: "#52c41a" }}>
              <DollarOutlined /> {totalRevenue.toFixed(2)} USD
            </Typography.Title>
          </div>
        </Space>
      </Card>

      <Table
        loading={loading}
        columns={columns}
        dataSource={payments}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} payments`,
        }}
      />
    </div>
  );
}
