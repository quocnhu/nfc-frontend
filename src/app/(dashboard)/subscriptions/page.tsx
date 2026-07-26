"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Space, Tag, Typography, Card, message, Popconfirm, Avatar, DatePicker, Modal, List } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, StopOutlined, CalendarOutlined } from "@ant-design/icons";
import { paymentApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import type { UserSubscription } from "@/types";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface CleanedUser {
  userId: string;
  fullname: string;
  email: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [counts, setCounts] = useState({ total: 0, active: 0, expired: 0 });
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanedUsers, setCleanedUsers] = useState<CleanedUser[]>([]);

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    loadSubscriptions();
  }, [isAdmin, router]);

  const loadSubscriptions = async (dates?: [Dayjs | null, Dayjs | null] | null) => {
    setLoading(true);
    try {
      const range = dates ?? dateRange;
      const startDate = range?.[0]?.format("YYYY-MM-DD");
      const endDate = range?.[1]?.format("YYYY-MM-DD");
      const res = await paymentApi.subscriptions(startDate, endDate);
      const data = res.data?.data;
      if (data && Array.isArray(data)) {
        setSubscriptions(data);
        setCounts({
          total: data.length,
          active: data.filter((s: UserSubscription) => s.isCurrent && s.status === "ACTIVE").length,
          expired: data.filter((s: UserSubscription) => s.status === "EXPIRED").length,
        });
      } else if (data && !Array.isArray(data)) {
        setSubscriptions(data.subscriptions || []);
        setCounts(data.counts || { total: 0, active: 0, expired: 0 });
      }
    } catch {
      messageApi.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    loadSubscriptions(dates);
  };

  const handleCancelSubscription = async (userId: string) => {
    try {
      setProcessing(userId);
      await paymentApi.cancelSubscription(userId);
      messageApi.success("Subscription cancelled");
      loadSubscriptions();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setProcessing(null);
    }
  };

  const handleCleanup = async () => {
    try {
      setProcessing("cleanup");
      const res = await paymentApi.cleanupExpired();
      const data = res.data?.data;
      const cleanedCount = data?.cleanedCount || 0;
      const users = data?.cleanedUsers || [];
      
      if (cleanedCount === 0) {
        messageApi.info("No expired subscriptions found");
      } else {
        setCleanedUsers(users);
        setCleanupModalOpen(true);
        loadSubscriptions();
      }
    } catch {
      messageApi.error("Failed to cleanup expired subscriptions");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      ACTIVE: { color: "green", icon: <CheckCircleOutlined /> },
      TRIAL: { color: "blue", icon: <ClockCircleOutlined /> },
      EXPIRED: { color: "red", icon: <CloseCircleOutlined /> },
      CANCELLED: { color: "default", icon: <StopOutlined /> },
      PAST_DUE: { color: "orange", icon: <ClockCircleOutlined /> },
      GRACE_PERIOD: { color: "gold", icon: <ClockCircleOutlined /> },
    };

    const config = statusConfig[status] || { color: "default", icon: null };
    return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
  };

  const getPlanTag = (planName?: string) => {
    if (!planName) return <Tag>Unknown</Tag>;

    const planColors: Record<string, string> = {
      FREE: "default",
      PRO: "blue",
      PROPLUS: "gold",
    };

    return <Tag color={planColors[planName] || "default"}>{planName}</Tag>;
  };

  const columns = [
    {
      title: "User",
      key: "user",
      filters: [...new Set(subscriptions.map((s) => s.user?.fullname).filter(Boolean))].map((name) => ({ text: name!, value: name! })),
      onFilter: (value: any, record: UserSubscription) => record.user?.fullname === value,
      render: (_: any, record: UserSubscription) => (
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
      title: "Plan",
      key: "plan",
      filters: [...new Set(subscriptions.map((s) => s.plan?.name).filter(Boolean))].map((name) => ({ text: name!, value: name! })),
      onFilter: (value: any, record: UserSubscription) => record.plan?.name === value,
      render: (_: any, record: UserSubscription) => getPlanTag(record.plan?.name),
    },
    {
      title: "Status",
      key: "status",
      filters: [...new Set(subscriptions.map((s) => s.status))].map((status) => ({ text: status, value: status })),
      onFilter: (value: any, record: UserSubscription) => record.status === value,
      render: (_: any, record: UserSubscription) => getStatusTag(record.status),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      sorter: (a: UserSubscription, b: UserSubscription) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      sorter: (a: UserSubscription, b: UserSubscription) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      render: (date: string) => {
        const endDate = new Date(date);
        const now = new Date();
        const isExpired = endDate < now;
        return (
          <Typography.Text style={{ color: isExpired ? "#ff4d4f" : undefined }}>
            {endDate.toLocaleDateString()}
          </Typography.Text>
        );
      },
    },
    {
      title: "Current",
      key: "isCurrent",
      filters: [{ text: "Yes", value: true }, { text: "No", value: false }],
      onFilter: (value: any, record: UserSubscription) => record.isCurrent === value,
      render: (_: any, record: UserSubscription) => (
        record.isCurrent ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: UserSubscription) => {
        if (!record.user) return null;

        return (
          <Space size="small">
            {record.isCurrent && (
              <Popconfirm
                title="Cancel this subscription?"
                description="The user will lose access immediately"
                onConfirm={() => handleCancelSubscription(record.userId)}
                okText="Yes, cancel"
                cancelText="No"
              >
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  loading={processing === record.userId}
                >
                  Cancel
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {contextHolder}

      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <Typography.Text type="secondary">Total Subscriptions</Typography.Text>
            <br />
            <Typography.Title level={3} style={{ margin: 0 }}>
              {counts.total}
            </Typography.Title>
          </div>
          <div>
            <Typography.Text type="secondary">Active</Typography.Text>
            <br />
            <Typography.Title level={3} style={{ margin: 0, color: "#52c41a" }}>
              {counts.active}
            </Typography.Title>
          </div>
          <div>
            <Typography.Text type="secondary">Expired</Typography.Text>
            <br />
            <Typography.Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
              {counts.expired}
            </Typography.Title>
          </div>
        </Space>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Space>
            <CalendarOutlined />
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={["Start Date", "End Date"]}
              style={{ width: 280 }}
            />
          </Space>
          <Popconfirm
            title="Cleanup expired subscriptions?"
            description="This will mark all expired subscriptions and update user statuses"
            onConfirm={handleCleanup}
            okText="Yes, cleanup"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<ClockCircleOutlined />}
              loading={processing === "cleanup"}
            >
              Cleanup Expired
            </Button>
          </Popconfirm>
        </div>
      </Card>

      <Table
        loading={loading}
        columns={columns}
        dataSource={subscriptions}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} subscriptions`,
        }}
      />

      <Modal
        title="Cleanup Complete"
        open={cleanupModalOpen}
        onCancel={() => setCleanupModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setCleanupModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>
            {cleanedUsers.length} expired subscription{cleanedUsers.length !== 1 ? "s" : ""} cleaned up
          </Typography.Text>
        </div>
        <List
          size="small"
          dataSource={cleanedUsers}
          renderItem={(user) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size="small">{user.fullname?.charAt(0)}</Avatar>}
                title={user.fullname}
                description={user.email}
              />
              <Tag color="red">INACTIVE</Tag>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
