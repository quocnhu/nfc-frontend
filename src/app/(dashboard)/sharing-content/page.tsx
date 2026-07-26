"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, AutoComplete, Select, Tooltip, Segmented } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, UserOutlined, YoutubeOutlined, TikTokOutlined, FacebookOutlined, InstagramOutlined, LinkedinOutlined, TwitterOutlined, GithubOutlined, GlobalOutlined, MailOutlined, PhoneOutlined, StarOutlined, LinkOutlined as LinkIconOutlined } from "@ant-design/icons";
import { sharingApi, dashboardApi, userApi, uploadApi } from "@/lib/api";
import { formatDate } from "@/utils/helpers";
import type { SharingContent, User } from "@/types";
import PhoneInput from "@/components/PhoneInput";

interface IconItem {
  name: string;
  url: string;
  path: string;
}

function getIconComponent(iconName: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    youtube: <YoutubeOutlined style={{ color: "#ff0000" }} />,
    tiktok: <TikTokOutlined style={{ color: "#000000" }} />,
    facebook: <FacebookOutlined style={{ color: "#1877f2" }} />,
    instagram: <InstagramOutlined style={{ color: "#e4405f" }} />,
    linkedin: <LinkedinOutlined style={{ color: "#0a66c2" }} />,
    twitter: <TwitterOutlined style={{ color: "#1da1f2" }} />,
    github: <GithubOutlined style={{ color: "#333333" }} />,
    globe: <GlobalOutlined style={{ color: "#4f46e5" }} />,
    mail: <MailOutlined style={{ color: "#ea4335" }} />,
    phone: <PhoneOutlined style={{ color: "#34a853" }} />,
    star: <StarOutlined style={{ color: "#fbbc04" }} />,
    link: <LinkIconOutlined style={{ color: "#4f46e5" }} />,
    world: <GlobalOutlined style={{ color: "#4f46e5" }} />,
  };
  return map[iconName?.toLowerCase()] || <LinkIconOutlined style={{ color: "#4f46e5" }} />;
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [urlType, setUrlType] = useState<string>("link");

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
    setUrlType("link");
    setModalOpen(true);
  };

  const handleEdit = (item: SharingContent) => {
    setEditingItem(item);
    // Detect URL type from existing URL
    if (item.url.startsWith("tel:")) {
      setUrlType("phone");
      // Extract phone number without tel: prefix
      form.setFieldsValue({ ...item, url: item.url.substring(4) });
    } else if (item.url.startsWith("mailto:")) {
      setUrlType("email");
      // Extract email without mailto: prefix
      form.setFieldsValue({ ...item, url: item.url.substring(7) });
    } else {
      setUrlType("link");
      form.setFieldsValue(item);
    }
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

  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) {
      messageApi.warning("Please select items to delete");
      return;
    }
    try {
      const ids = selectedRowKeys.map(key => String(key));
      const deletableItems = items.filter(item => {
        const isOwner = item.userId === currentUserId;
        return hasReadAll || (canDelete && isOwner);
      });
      const deletableIds = deletableItems.map(item => item.id).filter(id => ids.includes(id));
      if (!deletableIds.length) {
        messageApi.warning("No deletable items selected");
        return;
      }
      await sharingApi.bulkDelete(deletableIds);
      messageApi.success(`Deleted ${deletableIds.length} item(s)`);
      setSelectedRowKeys([]);
      load();
    } catch {
      messageApi.error("Failed to delete selected items");
    }
  };

  const handleSubmit = async () => {
    try {
      setModalLoading(true);
      const values = await form.validateFields();
      
      // Format URL based on type
      let formattedUrl = values.url;
      if (urlType === "phone") {
        formattedUrl = `tel:${values.url}`;
      } else if (urlType === "email") {
        formattedUrl = `mailto:${values.url}`;
      }
      
      if (editingItem) {
        await sharingApi.update({ id: editingItem.id, itemName: values.itemName, url: formattedUrl, icon: values.icon });
        messageApi.success("Updated");
      } else {
        const payload: any = { itemName: values.itemName, url: formattedUrl, icon: values.icon };
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
      render: (url: string) => {
        const getIcon = () => {
          if (url.startsWith("tel:")) return <PhoneOutlined style={{ color: "#34a853" }} />;
          if (url.startsWith("mailto:")) return <MailOutlined style={{ color: "#ea4335" }} />;
          return <LinkOutlined style={{ color: "#4f46e5" }} />;
        };
        const displayUrl = url.startsWith("tel:") ? url.substring(4) : url.startsWith("mailto:") ? url.substring(7) : url;
        return (
          <Tooltip title={url}>
            <Typography.Link href={url} target="_blank" style={{ maxWidth: 220 }}>
              {getIcon()} <Typography.Text ellipsis style={{ maxWidth: 180 }}>{displayUrl}</Typography.Text>
            </Typography.Link>
          </Tooltip>
        );
      },
    },
    { title: "Icon", dataIndex: "icon", key: "icon", filterSearch: true,
      filters: [...new Set(items.map((i) => i.icon))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: SharingContent) => record.icon === value,
      render: (icon: string) => {
        const iconItem = icons.find(i => i.name.replace(/\.[^.]+$/, "") === icon);
        return (
          <Tooltip title={icon}>
            {iconItem ? (
              <img src={iconItem.url} alt={icon} style={{ width: 24, height: 24, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 16 }}>{getIconComponent(icon)}</span>
            )}
          </Tooltip>
        );
      },
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
      <Space style={{ marginBottom: 16 }}>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create
          </Button>
        )}
        {canDelete && selectedRowKeys.length > 0 && (
          <Popconfirm
            title={`Delete ${selectedRowKeys.length} selected item(s)?`}
            onConfirm={handleBulkDelete}
            okText="Delete"
            okType="danger"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete Selected ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        )}
      </Space>
      <Table
        loading={loading}
        columns={columns}
        dataSource={items}
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{ current: pagination.current, pageSize: pagination.pageSize, showSizeChanger: true, showTotal: (total) => `Total ${total} items`, onChange: (page, size) => setPagination({ current: page, pageSize: size }) }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          getCheckboxProps: (record: SharingContent) => {
            const isOwner = record.userId === currentUserId;
            const canRemove = hasReadAll || (canDelete && isOwner);
            return { disabled: !canRemove };
          },
        }}
      />

      <Modal
        title={editingItem ? "Edit" : "Create"}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setModalOpen(false)}
        width={600}
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
            <Input placeholder="e.g. YouTube, Phone, Email" />
          </Form.Item>
          <Form.Item label="URL Type">
            <Segmented
              value={urlType}
              onChange={(value) => {
                setUrlType(value as string);
                form.setFieldValue("url", "");
              }}
              options={[
                { label: "Link", value: "link", icon: <LinkOutlined /> },
                { label: "Email", value: "email", icon: <MailOutlined /> },
                { label: "Phone", value: "phone", icon: <PhoneOutlined /> },
              ]}
              block
            />
          </Form.Item>
          <Form.Item 
            name="url" 
            label={urlType === "link" ? "URL" : urlType === "email" ? "Email Address" : "Phone Number"} 
            rules={[{ required: true, message: `Please enter ${urlType === "link" ? "a URL" : urlType === "email" ? "an email" : "a phone number"}` }]}
          >
            {urlType === "phone" ? (
              <PhoneInput 
                placeholder="Enter phone number"
              />
            ) : urlType === "email" ? (
              <Input 
                placeholder="email@example.com" 
                prefix={<MailOutlined />}
                type="email"
              />
            ) : (
              <Input 
                placeholder="https://youtube.com/@user" 
                prefix={<LinkOutlined />}
              />
            )}
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
