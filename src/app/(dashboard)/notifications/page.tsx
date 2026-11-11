"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  DeleteOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { notificationApi, roleApi, userApi } from "@/lib/api";
import { extractApiError } from "@/lib/api-error";
import { formatDateTime } from "@/utils/helpers";
import type {
  NotificationAudience,
  Role,
  SentNotification,
} from "@/types";

const { TextArea } = Input;

export default function NotificationsPage() {
  const [items, setItems] = useState<SentNotification[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const audience = Form.useWatch<NotificationAudience>("audienceType", form);
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = async (search?: string) => {
    setUserLoading(true);
    try {
      const res = await userApi.list({ page: 1, limit: 20, search: search || undefined });
      setUserOptions(
        (res.data?.data?.data || []).map((user) => ({
          label: `${user.fullname} (${user.email})`,
          value: user.id,
        })),
      );
    } catch {
      setUserOptions([]);
    } finally {
      setUserLoading(false);
    }
  };

  const searchUsers = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(value.trim()), 300);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.adminList();
      setItems(res.data?.data || []);
    } catch (error) {
      messageApi.error(extractApiError(error, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load mirrors existing app pattern
    load();
    roleApi
      .list()
      .then((res) => setRoles(res.data?.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const openModal = () => {
    form.resetFields();
    form.setFieldsValue({ audienceType: "ALL", sendEmail: true });
    void loadUsers();
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      await notificationApi.send(values);
      messageApi.success("Notification sent");
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (error) {
      messageApi.error(extractApiError(error, "Failed to send notification"));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await notificationApi.remove(id);
      messageApi.success("Notification deleted");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      messageApi.error(extractApiError(error, "Failed to delete notification"));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Notification",
      key: "title",
      render: (_: unknown, record: SentNotification) => (
        <div style={{ maxWidth: 420 }}>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 0, fontSize: 12 }}
          >
            {record.body}
          </Typography.Paragraph>
        </div>
      ),
    },
    {
      title: "Audience",
      key: "audience",
      width: 170,
      render: (_: unknown, record: SentNotification) =>
        record.audienceType === "ROLE" ? (
          <Tag icon={<TeamOutlined />} color="purple">
            {record.role?.name || "Group"}
          </Tag>
        ) : record.audienceType === "USER" ? (
          <Tag icon={<UserOutlined />} color="green">
            {record.targetUser?.fullname || "Single user"}
          </Tag>
        ) : (
          <Tag icon={<GlobalOutlined />} color="blue">
            All users
          </Tag>
        ),
    },
    {
      title: "Recipients",
      key: "recipientCount",
      width: 130,
      align: "center" as const,
      render: (_: unknown, record: SentNotification) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.recipientCount}</Typography.Text>
          {record.skippedCount > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {record.skippedCount} skipped
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "Read",
      key: "read",
      width: 110,
      align: "center" as const,
      render: (_: unknown, record: SentNotification) => (
        <Typography.Text>
          {record.readCount}/{record.recipientCount}
        </Typography.Text>
      ),
    },
    {
      title: "Email",
      key: "email",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: SentNotification) =>
        record.sendEmail ? (
          <Space size={4}>
            <MailOutlined style={{ color: "#1677ff" }} />
            <Typography.Text>
              {record.emailCount}/{record.recipientCount}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">Off</Typography.Text>
        ),
    },
    {
      title: "Sent by",
      key: "createdBy",
      width: 160,
      render: (_: unknown, record: SentNotification) =>
        record.createdBy?.fullname || "—",
    },
    {
      title: "Sent at",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      align: "center" as const,
      render: (_: unknown, record: SentNotification) => (
        <Popconfirm
          title="Delete this notification?"
          description="It will also disappear from users' bell lists."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => remove(record.id)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deletingId === record.id}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Space>
          <BellOutlined style={{ fontSize: 22 }} />
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Notifications
            </Typography.Title>
            <Typography.Text type="secondary">
              Send a bell notification and optional email to all users, a role, or one user.
            </Typography.Text>
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          Send notification
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 1040 }}
      />

      <Modal
        title="Send notification"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText="Send"
        confirmLoading={sending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ audienceType: "ALL", sendEmail: true }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Enter a title" }]}
          >
            <Input maxLength={150} showCount placeholder="e.g. System maintenance" />
          </Form.Item>
          <Form.Item
            name="body"
            label="Message"
            rules={[{ required: true, message: "Enter a message" }]}
          >
            <TextArea
              rows={5}
              maxLength={5000}
              showCount
              placeholder="Write the message users will see in the bell list and email"
            />
          </Form.Item>
          <Form.Item name="audienceType" label="Audience" rules={[{ required: true }]}>
            <Select
              onChange={() =>
                form.setFieldsValue({ roleId: undefined, userId: undefined })
              }
              options={[
                { label: "All users", value: "ALL" },
                { label: "Group (role)", value: "ROLE" },
                { label: "Single user", value: "USER" },
              ]}
            />
          </Form.Item>
          {audience === "ROLE" && (
            <Form.Item
              name="roleId"
              label="Group / role"
              rules={[{ required: true, message: "Choose a group" }]}
            >
              <Select
                placeholder="Choose a role"
                options={roles.map((role) => ({
                  label: role.name,
                  value: role.id,
                }))}
              />
            </Form.Item>
          )}
          {audience === "USER" && (
            <Form.Item
              name="userId"
              label="User"
              rules={[{ required: true, message: "Choose a user" }]}
            >
              <Select
                showSearch
                filterOption={false}
                onSearch={searchUsers}
                loading={userLoading}
                placeholder="Search by name or email"
                options={userOptions}
                notFoundContent={userLoading ? "Searching..." : "No users found"}
              />
            </Form.Item>
          )}
          <Form.Item name="sendEmail" valuePropName="checked">
            <Checkbox>Also send this message by email</Checkbox>
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
            <InfoCircleOutlined /> Each user can receive at most 3 admin messages per
            24 hours. Recipients over the limit are skipped.
          </Typography.Paragraph>
        </Form>
      </Modal>
    </>
  );
}
