"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, AutoComplete, Select, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, UserOutlined } from "@ant-design/icons";
import { sharingApi, dashboardApi, userApi, uploadApi } from "@/lib/api";
import { formatDate } from "@/utils/helpers";
import type { SharingContent, User } from "@/types";

interface IconItem {
  name: string;
  url: string;
  path: string;
}

export default function SharingContentPage() {
  const [items, setItems] = useState<SharingContent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SharingContent | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [hasReadAll, setHasReadAll] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const userOptions = useMemo(() =>
    users.map((u) => ({
      value: u.id,
      label: `${u.fullname} (${u.email})`,
    })),
  [users]);

  const iconOptions = useMemo(() =>
    icons.map((icon) => ({
      value: icon.name.replace(/\.[^.]+$/, ""),
      label: icon.name.replace(/\.[^.]+$/, ""),
      iconUrl: icon.url,
    })),
  [icons]);

  const load = async () => {
    setLoading(true);
    try {
      const [contentRes, permsRes, iconsRes] = await Promise.allSettled([
        sharingApi.list(),
        dashboardApi.permissions(),
        uploadApi.listIcons(),
      ]);
      if (contentRes.status === "fulfilled") {
        setItems(contentRes.value.data?.data || []);
      }
      if (permsRes.status === "fulfilled") {
        const data = permsRes.value.data?.data;
        const merged = data?.mergedPermissions || [];
        const isAdmin = merged.includes("read:sharingcontent:all");
        setHasReadAll(isAdmin);
        setCanCreate(merged.includes("create:sharingcontent"));
        setCanUpdate(merged.includes("update:sharingcontent"));
        setCanDelete(merged.includes("delete:sharingcontent"));
        setCurrentUserId(data?.user?.id || "");
        if (isAdmin) {
          const usersRes = await userApi.list({ page: 1, limit: 100 }).catch(() => null);
          if (usersRes) setUsers(usersRes.data?.data?.data || []);
        }
      }
      if (iconsRes.status === "fulfilled") {
        setIcons(iconsRes.value.data?.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item: SharingContent) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await sharingApi.remove(id);
      messageApi.success("Deleted");
      load();
    } catch {
      messageApi.error("Failed to delete");
    }
  };

  const handleSubmit = async () => {
    try {
      setModalLoading(true);
      const values = await form.validateFields();
      if (editingItem) {
        await sharingApi.update({ id: editingItem.id, itemName: values.itemName, url: values.url, icon: values.icon });
        messageApi.success("Updated");
      } else {
        const payload: any = { itemName: values.itemName, url: values.url, icon: values.icon };
        if (values.targetUserId) payload.targetUserId = values.targetUserId;
        await sharingApi.create(payload);
        messageApi.success("Created");
      }
      setModalOpen(false);
      load();
    } catch {
      messageApi.error("Failed to save");
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { title: "#", key: "index", width: 60, render: (_: any, __: any, i: number) => (pagination.current - 1) * pagination.pageSize + i + 1 },
    { title: "Item Name", dataIndex: "itemName", key: "itemName", filterSearch: true,
      filters: [...new Set(items.map((i) => i.itemName))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: SharingContent) => record.itemName.includes(value),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 250,
      filterSearch: true,
      filters: items.map((i) => ({ text: i.url, value: i.url })),
      onFilter: (value: any, record: SharingContent) => record.url === value,
      render: (url: string) => (
        <Tooltip title={url}>
          <Typography.Link href={url} target="_blank" style={{ maxWidth: 220 }}>
            <LinkOutlined /> <Typography.Text ellipsis style={{ maxWidth: 180 }}>{url}</Typography.Text>
          </Typography.Link>
        </Tooltip>
      ),
    },
    { title: "Icon", dataIndex: "icon", key: "icon", filterSearch: true,
      filters: [...new Set(items.map((i) => i.icon))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: SharingContent) => record.icon === value,
    },
    { title: "CreatedDate", dataIndex: "createdAt", key: "createdAt",
      filters: [...new Set(items.map((i) => formatDate(i.createdAt)))].map((d) => ({ text: d, value: d })),
      onFilter: (value: any, record: SharingContent) => formatDate(record.createdAt) === value,
      render: formatDate,
    },
    {
      title: "CreatedBy",
      key: "creator",
      filterSearch: true,
      filters: [...new Set(items.map((i) => i.creator?.fullname || i.user?.fullname || "-"))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: SharingContent) => (record.creator?.fullname || record.user?.fullname || "-") === value,
      render: (_: any, record: SharingContent) => (
        <span>{record.creator?.fullname || record.user?.fullname || "-"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: SharingContent) => {
        const isOwner = record.userId === currentUserId;
        const canEdit = hasReadAll || (canUpdate && isOwner);
        const canRemove = hasReadAll || (canDelete && isOwner);
        if (!canEdit && !canRemove) return null;
        return (
          <Space>
            {canEdit && <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />}
            {canRemove && (
              <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      {canCreate && (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
          Create
        </Button>
      )}
      <Table loading={loading} columns={columns} dataSource={items} rowKey="id" scroll={{ x: "max-content" }} pagination={{ current: pagination.current, pageSize: pagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} items`, onChange: (page, size) => setPagination({ current: page, pageSize: size }) }} />

      <Modal
        title={editingItem ? "Edit" : "Create"}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          {hasReadAll && (
            <Form.Item name="targetUserId" label="Assign to User">
              <AutoComplete
                options={userOptions}
                placeholder="Search user by name or email..."
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              />
            </Form.Item>
          )}
          <Form.Item name="itemName" label="Item Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. YouTube" />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true, message: "Please enter a URL" }]}>
            <Input placeholder="https://youtube.com/@user or mailto:email@example.com" />
          </Form.Item>
          <Form.Item name="icon" label="Icon" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select an icon..."
              optionFilterProp="label"
              options={iconOptions}
              notFoundContent="No icons uploaded yet"
              dropdownRender={(menu) => menu}
              optionRender={(option) => (
                <Space style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img
                    src={option.data.iconUrl}
                    alt={option.data.label}
                    style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4 }}
                  />
                  <span>{option.data.label}</span>
                </Space>
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
