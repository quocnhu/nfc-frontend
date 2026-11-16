"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography, AutoComplete, Select, Tooltip, Segmented, Tag, Empty, Spin, Checkbox } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, YoutubeOutlined, TikTokOutlined, FacebookOutlined, InstagramOutlined, LinkedinOutlined, TwitterOutlined, GithubOutlined, GlobalOutlined, MailOutlined, PhoneOutlined, StarOutlined, LinkOutlined as LinkIconOutlined, AppstoreOutlined, EyeOutlined, TeamOutlined, SearchOutlined } from "@ant-design/icons";
import { sharingApi, dashboardApi, userApi, uploadApi, templateApi, roleApi } from "@/lib/api";
import { safeUrl } from "@/lib/safe-url";
import { getPublicBaseUrl } from "@/lib/public-url";
import { formatDate } from "@/utils/helpers";
import type { SharingContent, User, Template, Role } from "@/types";
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
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectingTemplateId, setSelectingTemplateId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    if (!query) return templates;
    return templates.filter((template) =>
      [template.name, template.slug, template.category, template.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [templates, templateSearch]);

  const [roleTemplateModalOpen, setRoleTemplateModalOpen] = useState(false);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleTemplatesLoading, setRoleTemplatesLoading] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [canManageRoleTemplates, setCanManageRoleTemplates] = useState(false);

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
        setCanManageRoleTemplates(
          merged.includes("update:role") ||
            merged.includes("read:role") ||
            merged.includes("read:user:all") ||
            merged.includes("create:role"),
        );
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load mirrors existing app pattern
    load();
  }, []);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await templateApi.mine();
      const data = res.data?.data;
      setTemplates(data?.templates || []);
      setSelectedTemplateId(data?.selectedTemplateId ?? null);
    } catch {
      messageApi.error("Failed to load templates");
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load mirrors existing app pattern
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial data load only
  }, []);

  const loadRoleTemplates = async () => {
    setRoleTemplatesLoading(true);
    try {
      const [rolesRes, templatesRes] = await Promise.allSettled([
        roleApi.list(),
        templateApi.list(),
      ]);

      const roleList = rolesRes.status === "fulfilled" ? rolesRes.value.data?.data || [] : [];
      if (roleList.length) setRoles(roleList);

      let catalog =
        templatesRes.status === "fulfilled" ? templatesRes.value.data?.data || [] : [];

      // Fallback: build the catalog from templates already assigned to roles.
      // This keeps the assignment table usable even if the catalog endpoint is
      // unavailable for the current account.
      if (!catalog.length) {
        const map = new Map<string, Template>();
        for (const role of roleList) {
          for (const rt of role.templates || []) {
            if (!map.has(rt.template.id)) map.set(rt.template.id, rt.template);
          }
        }
        catalog = Array.from(map.values()).sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
      }
      if (catalog.length) setAllTemplates(catalog);

      if (rolesRes.status === "rejected" && templatesRes.status === "rejected") {
        messageApi.error("Failed to load role templates (permission denied or server error)");
      } else if (rolesRes.status === "rejected") {
        messageApi.error("Failed to load roles for template assignments");
      }
    } finally {
      setRoleTemplatesLoading(false);
    }
  };

  const handleToggleRoleTemplate = async (role: Role, templateId: string, checked: boolean) => {
    const currentIds = (role.templates || []).map((rt) => rt.template.id);
    const nextIds = checked
      ? Array.from(new Set([...currentIds, templateId]))
      : currentIds.filter((id) => id !== templateId);
    setSavingRoleId(role.id);
    try {
      await roleApi.update({ id: role.id, templateIds: nextIds });
      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id
            ? {
                ...r,
                templates: nextIds.map((id) => {
                  const tpl = allTemplates.find((t) => t.id === id);
                  return tpl ? { template: tpl } : null;
                }).filter(Boolean) as { template: Template }[],
              }
            : r,
        ),
      );
      messageApi.success(`Updated templates for ${role.name}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      messageApi.error(typeof msg === "string" ? msg : "Failed to update role templates");
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    setSelectingTemplateId(templateId);
    try {
      await templateApi.select(templateId);
      setSelectedTemplateId(templateId);
      messageApi.success("Template selected");
    } catch (err: unknown) {
      const responseMsg = (err as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message;
      const msg = typeof responseMsg === "string" ? responseMsg : "Failed to select template";
      messageApi.error(msg);
    } finally {
      setSelectingTemplateId(null);
    }
  };

  const handlePreview = () => {
    if (!currentUserId) {
      messageApi.warning("User id not available yet");
      return;
    }
    window.open(
      `${getPublicBaseUrl()}/public/user?userId=${currentUserId}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

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

      const validatedUrl = safeUrl(formattedUrl);
      if (!validatedUrl) {
        messageApi.error("Invalid URL scheme. Only http(s), mailto and tel are allowed.");
        return;
      }
      formattedUrl = validatedUrl;
      
      if (editingItem) {
        await sharingApi.update({ id: editingItem.id, itemName: values.itemName, url: formattedUrl, icon: values.icon });
        messageApi.success("Updated");
      } else {
        const payload: { itemName: string; url: string; icon: string; targetUserId?: string } = { itemName: values.itemName, url: formattedUrl, icon: values.icon };
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
    { title: "#", key: "index", width: 60, render: (_: unknown, __: unknown, i: number) => (pagination.current - 1) * pagination.pageSize + i + 1 },
    { title: "Item Name", dataIndex: "itemName", key: "itemName", filterSearch: true,
      filters: [...new Set(items.map((i) => i.itemName))].map((n) => ({ text: n, value: n })),
      onFilter: (value: React.Key | boolean | undefined, record: SharingContent) => record.itemName.includes(String(value)),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 250,
      filterSearch: true,
      filters: items.map((i) => ({ text: i.url, value: i.url })),
      onFilter: (value: React.Key | boolean | undefined, record: SharingContent) => record.url === value,
      render: (url: string) => {
        const getIcon = () => {
          if (url.startsWith("tel:")) return <PhoneOutlined style={{ color: "#34a853" }} />;
          if (url.startsWith("mailto:")) return <MailOutlined style={{ color: "#ea4335" }} />;
          return <LinkOutlined style={{ color: "#4f46e5" }} />;
        };
        const displayUrl = url.startsWith("tel:") ? url.substring(4) : url.startsWith("mailto:") ? url.substring(7) : url;
        const safeHref = safeUrl(url);
        return (
          <Tooltip title={url}>
            {safeHref ? (
              <Typography.Link href={safeHref} target="_blank" rel="noopener noreferrer" style={{ maxWidth: 220 }}>
                {getIcon()} <Typography.Text ellipsis style={{ maxWidth: 180 }}>{displayUrl}</Typography.Text>
              </Typography.Link>
            ) : (
              <span style={{ maxWidth: 220, display: "inline-block" }}>
                {getIcon()} <Typography.Text ellipsis style={{ maxWidth: 180 }}>{displayUrl}</Typography.Text>
              </span>
            )}
          </Tooltip>
        );
      },
    },
    { title: "Icon", dataIndex: "icon", key: "icon", filterSearch: true,
      filters: [...new Set(items.map((i) => i.icon))].map((n) => ({ text: n, value: n })),
      onFilter: (value: React.Key | boolean | undefined, record: SharingContent) => record.icon === value,
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
      onFilter: (value: React.Key | boolean | undefined, record: SharingContent) => formatDate(record.createdAt) === value,
      render: formatDate,
    },
    {
      title: "CreatedBy",
      key: "creator",
      filterSearch: true,
      filters: [...new Set(items.map((i) => i.creator?.fullname || i.user?.fullname || "-"))].map((n) => ({ text: n, value: n })),
      onFilter: (value: React.Key | boolean | undefined, record: SharingContent) => (record.creator?.fullname || record.user?.fullname || "-") === value,
      render: (_: unknown, record: SharingContent) => (
        <span>{record.creator?.fullname || record.user?.fullname || "-"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: SharingContent) => {
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
      <Space style={{ marginBottom: 16 }} wrap>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create
          </Button>
        )}
        <Button
          icon={<AppstoreOutlined />}
          onClick={() => {
            setTemplateSearch("");
            setTemplateModalOpen(true);
            loadTemplates();
          }}
        >
          Templates
        </Button>
        {canManageRoleTemplates && (
          <Button
            icon={<TeamOutlined />}
            onClick={() => {
              setRoleTemplateModalOpen(true);
              loadRoleTemplates();
            }}
          >
            Role Templates
          </Button>
        )}
        <Button
          icon={<EyeOutlined />}
          disabled={!selectedTemplateId}
          onClick={handlePreview}
        >
          Preview
        </Button>
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

      <Modal
        title={<span><AppstoreOutlined /> Choose your NFC template</span>}
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={760}
        centered
        style={{ maxWidth: "calc(100vw - 24px)" }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100dvh - 180px)",
            minHeight: 0,
          }}
        >
          <div style={{ padding: "16px clamp(12px, 4vw, 24px) 8px" }}>
            <Typography.Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 12 }}>
              Select the template shown when someone taps your NFC card. Only templates
              available to your role are listed.
            </Typography.Paragraph>
            <Input
              allowClear
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              placeholder="Search by name, category or description..."
            />
            {!templatesLoading && templates.length > 0 && (
              <Typography.Text
                type="secondary"
                style={{ display: "block", marginTop: 8, fontSize: 12 }}
              >
                Showing {filteredTemplates.length} of {templates.length} templates
              </Typography.Text>
            )}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "8px clamp(12px, 4vw, 24px) 16px",
            }}
          >
            {templatesLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin />
              </div>
            ) : templates.length === 0 ? (
              <Empty description="No templates available for your role" />
            ) : filteredTemplates.length === 0 ? (
              <Empty description="No templates match your search" />
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                }}
              >
                {filteredTemplates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  return (
                    <div
                      key={template.id}
                      style={{
                        position: "relative",
                        border: isSelected ? "2px solid #1677ff" : "1px solid #d9d9d9",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minHeight: 170,
                      }}
                    >
                      {isSelected && (
                        <Tag color="blue" style={{ position: "absolute", top: 8, right: 8, margin: 0 }}>
                          Selected
                        </Tag>
                      )}
                      <Typography.Title level={5} style={{ margin: 0, paddingRight: 70 }}>
                        {template.name}
                      </Typography.Title>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {template.category || "General"}
                      </Typography.Text>
                      <Typography.Paragraph
                        type="secondary"
                        style={{ fontSize: 12, margin: "4px 0 10px", flex: 1 }}
                        ellipsis={{ rows: 3 }}
                      >
                        {template.description || "No description"}
                      </Typography.Paragraph>
                      <Button
                        block
                        type={isSelected ? "default" : "primary"}
                        disabled={isSelected}
                        loading={selectingTemplateId === template.id}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        {isSelected ? "Selected" : "Use this template"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px clamp(12px, 4vw, 24px)",
              borderTop: "1px solid rgba(5, 5, 5, 0.06)",
              textAlign: "right",
            }}
          >
            <Button
              icon={<EyeOutlined />}
              disabled={!selectedTemplateId}
              onClick={handlePreview}
            >
              Preview selected
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={<span><TeamOutlined /> Role ↔ Template assignments</span>}
        open={roleTemplateModalOpen}
        onCancel={() => setRoleTemplateModalOpen(false)}
        footer={null}
        width={1000}
        style={{ maxWidth: "98vw" }}
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Check which templates each role can use. Tick/untick to assign; changes save immediately.
        </Typography.Paragraph>
        {roleTemplatesLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : (
          <Table
            rowKey="id"
            dataSource={roles}
            pagination={false}
            scroll={{ x: "max-content" }}
            columns={[
              {
                title: "Role",
                dataIndex: "name",
                key: "name",
                fixed: "left",
                render: (name: string) => <Tag color="blue">{name}</Tag>,
              },
              ...allTemplates.map((tpl) => ({
                title: (
                  <div style={{ textAlign: "center", minWidth: 90 }}>
                    <div>{tpl.name}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{tpl.slug}</Typography.Text>
                  </div>
                ),
                key: tpl.id,
                align: "center" as const,
                render: (_: unknown, role: Role) => {
                  const checked = (role.templates || []).some((rt) => rt.template.id === tpl.id);
                  return (
                    <Checkbox
                      checked={checked}
                      disabled={savingRoleId === role.id}
                      onChange={(e) => handleToggleRoleTemplate(role, tpl.id, e.target.checked)}
                    />
                  );
                },
              })),
              {
                title: "Allowed",
                key: "count",
                render: (_: unknown, role: Role) => (role.templates || []).length,
              },
            ]}
          />
        )}
      </Modal>
    </>
  );
}
