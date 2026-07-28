"use client";

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, Popconfirm, Tooltip, Checkbox, Typography, Tabs, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, SettingOutlined, ApiOutlined } from "@ant-design/icons";
import { paymentApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/types";

export default function PlansPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Protected Routes tab state
  const [routes, setRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("plans");

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    loadPlans();
    loadRoutes();
  }, [isAdmin, router]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAllPlans();
      setPlans(res.data?.data || []);
    } catch (err: any) {
      messageApi.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    setRoutesLoading(true);
    try {
      const res = await paymentApi.getPlanRoutes();
      const data = res.data?.data;
      setRoutes(data?.routes || []);
    } catch (err: any) {
      messageApi.error("Failed to load routes");
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleToggleRoutePermission = async (planId: string, permissionId: string, hasPermission: boolean) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const currentPermIds = plan.planPermissions?.map((pp: any) => pp.permission.id) || [];
    let newPermIds: string[];
    
    if (hasPermission) {
      newPermIds = currentPermIds.filter((id: string) => id !== permissionId);
    } else {
      newPermIds = [...currentPermIds, permissionId];
    }

    try {
      await paymentApi.updatePlan({ 
        id: planId, 
        permissionIds: newPermIds 
      });
      messageApi.success("Route access updated");
      loadPlans();
      loadRoutes();
    } catch (err: any) {
      messageApi.error("Failed to update route access");
    }
  };

  const handleCreate = async () => {
    setEditingPlan(null);
    form.resetFields();
    form.setFieldsValue({
      currency: "USD",
      isActive: true,
      price: 0,
      durationValue: 30,
      durationUnit: "minutes",
    });
    setModalOpen(true);
  };

  const handleEdit = async (plan: any) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  // Set form values when modal opens for editing
  useEffect(() => {
    if (modalOpen && editingPlan) {
      // Convert durationDays to appropriate unit
      let durationValue = editingPlan.durationDays;
      let durationUnit = 'days';
      
      if (editingPlan.durationDays < 1) {
        // Convert to hours or minutes
        const hours = editingPlan.durationDays * 24;
        if (hours < 1) {
          durationValue = Math.round(editingPlan.durationDays * 24 * 60);
          durationUnit = 'minutes';
        } else {
          durationValue = hours;
          durationUnit = 'hours';
        }
      }
      
      // Set form values directly
      form.setFieldsValue({
        name: editingPlan.name,
        displayName: editingPlan.displayName,
        description: editingPlan.description,
        features: editingPlan.features || [],
        price: editingPlan.price,
        currency: editingPlan.currency,
        durationValue,
        durationUnit,
        isActive: editingPlan.isActive,
      });
    } else if (modalOpen && !editingPlan) {
      // Reset form for create mode
      form.resetFields();
      form.setFieldsValue({
        currency: "USD",
        isActive: true,
        price: 0,
        durationValue: 30,
        durationUnit: "minutes",
      });
    }
  }, [modalOpen, editingPlan]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Convert duration to days
      let durationDays = values.durationValue;
      if (values.durationUnit === 'minutes') {
        durationDays = values.durationValue / (24 * 60);
      } else if (values.durationUnit === 'hours') {
        durationDays = values.durationValue / 24;
      }

      const payload = {
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        features: values.features || [],
        price: values.price,
        currency: values.currency,
        durationDays,
        isActive: values.isActive,
      };

      if (editingPlan) {
        await paymentApi.updatePlan({ id: editingPlan.id, ...payload });
        messageApi.success("Plan updated");
      } else {
        await paymentApi.createPlan(payload);
        messageApi.success("Plan created");
      }

      setModalOpen(false);
      loadPlans();
      loadRoutes();
    } catch (err: any) {
      if (err?.errorFields) return;
      messageApi.error(err?.response?.data?.message || "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await paymentApi.deletePlan(id);
      messageApi.success("Plan deleted");
      loadPlans();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to delete plan");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) {
      messageApi.warning("Please select plans to delete");
      return;
    }
    const ids = selectedRowKeys.map(key => String(key));
    const deletablePlans = plans.filter(p => ids.includes(p.id) && (!p._count?.subscriptions || p._count.subscriptions === 0));
    if (!deletablePlans.length) {
      messageApi.warning("No deletable plans selected (plans with active subscriptions cannot be deleted)");
      return;
    }
    try {
      await paymentApi.bulkDeletePlans(deletablePlans.map(p => p.id));
      messageApi.success(`Deleted ${deletablePlans.length} plan(s)`);
      setSelectedRowKeys([]);
      loadPlans();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to delete selected plans");
    }
  };

  const handleToggleActive = async (plan: any) => {
    try {
      await paymentApi.updatePlan({ id: plan.id, isActive: !plan.isActive });
      messageApi.success(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
      loadPlans();
    } catch (err: any) {
      messageApi.error("Failed to toggle plan");
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      align: 'center' as const,
      width: 150,
      filters: [...new Set(plans.map((p) => p.displayName))].map((name) => ({ text: name, value: name })),
      onFilter: (value: any, record: any) => record.displayName === value,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.displayName}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      align: 'center' as const,
      ellipsis: true,
      width: 200,
    },
    {
      title: "Price",
      key: "price",
      align: 'center' as const,
      width: 100,
      filters: [
        { text: "FREE", value: 0 },
        { text: "Paid", value: "paid" },
      ],
      onFilter: (value: any, record: any) => {
        if (value === 0) return record.price === 0;
        if (value === "paid") return record.price > 0;
        return true;
      },
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 600, color: record.price === 0 ? "#52c41a" : "#1890ff" }}>
          {record.price === 0 ? "FREE" : `$${record.price.toFixed(2)}`}
        </span>
      ),
    },
    {
      title: "Duration",
      dataIndex: "durationDays",
      key: "durationDays",
      align: 'center' as const,
      width: 120,
      render: (days: number) => {
        if (days < 1/24) {
          // Less than 1 hour, show in minutes
          const minutes = Math.round(days * 24 * 60);
          return <Tag>{minutes} {minutes === 1 ? 'minute' : 'minutes'}</Tag>;
        } else if (days < 1) {
          // Less than 1 day, show in hours
          const hours = Math.round(days * 24);
          return <Tag color="blue">{hours} {hours === 1 ? 'hour' : 'hours'}</Tag>;
        } else if (days === 30) {
          return <Tag color="blue">1 month</Tag>;
        } else if (days === 365) {
          return <Tag color="gold">1 year</Tag>;
        } else {
          return <Tag>{days} {days === 1 ? 'day' : 'days'}</Tag>;
        }
      },
    },
    {
      title: "Protected Routes",
      key: "permissions",
      align: 'center' as const,
      width: 140,
      render: (_: any, record: any) => {
        const perms = record.planPermissions?.map((pp: any) => pp.permission.name) || [];
        return (
          <Tag color="blue">{perms.length} routes protected</Tag>
        );
      },
    },
    {
      title: "Status",
      key: "isActive",
      width: 100,
      filters: [{ text: "Active", value: true }, { text: "Inactive", value: false }],
      onFilter: (value: any, record: any) => record.isActive === value,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      ),
    },
    {
      title: "Subscriptions",
      key: "subscriptions",
      width: 120,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a._count?.subscriptions || 0) - (b._count?.subscriptions || 0),
      render: (_: any, record: any) => (
        <Tag color={record._count?.subscriptions > 0 ? "blue" : "default"}>
          {record._count?.subscriptions || 0}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: 'center' as const,
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Edit Plan">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this plan?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record._count?.subscriptions > 0}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Protected Routes columns
  const protectedRouteColumns = [
    {
      title: "Route",
      key: "route",
      width: 280,
      render: (_: any, record: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <Tag color={
              record.method === 'GET' ? 'green' :
              record.method === 'POST' ? 'blue' :
              record.method === 'PUT' ? 'orange' :
              record.method === 'DELETE' ? 'red' : 'default'
            }>
              {record.method}
            </Tag>
            <Typography.Text code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
              {record.path}
            </Typography.Text>
          </div>
          <Tag color="purple" style={{ fontSize: '11px' }}>
            {record.permission}
          </Tag>
        </div>
      ),
    },
    ...plans.map(plan => ({
      title: plan.displayName,
      key: `plan-${plan.id}`,
      align: 'center' as const,
      width: 100,
      render: (_: any, record: any) => {
        const planData = record.plans?.find((p: any) => p.id === plan.id);
        const hasPermission = planData?.hasPermission || false;
        return (
          <Checkbox
            checked={hasPermission}
            onChange={() => handleToggleRoutePermission(plan.id, record.permissionId, hasPermission)}
          />
        );
      },
    })),
  ];

  return (
    <div>
      {contextHolder}
      
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === "protected-routes" && routes.length === 0) {
            loadRoutes();
          }
        }}
        items={[
          {
            key: "plans",
            label: "Plans",
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Create Plan
                  </Button>
                  {selectedRowKeys.length > 0 && (
                    <Popconfirm
                      title={`Delete ${selectedRowKeys.length} selected plan(s)?`}
                      onConfirm={handleBulkDelete}
                      okText="Delete"
                      okType="danger"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Delete Selected ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  )}
                </div>

                <Table
                  columns={columns}
                  dataSource={plans}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} plans`,
                  }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record: any) => ({
                      disabled: record._count?.subscriptions > 0,
                    }),
                  }}
                />
              </>
            ),
          },
          {
            key: "protected-routes",
            label: (
              <span>
                <ApiOutlined /> Protected Routes
              </span>
            ),
            children: (
              <>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Manage which routes are protected by each plan. Check the box to grant access to a plan.
                </Typography.Paragraph>
                <Typography.Paragraph type="warning" style={{ marginBottom: 16, fontSize: 12 }}>
                  <strong>Tip:</strong> Routes marked with <Tag color="green" style={{ margin: '0 2px' }}>GET</Tag> are read operations. 
                  Routes with <Tag color="blue" style={{ margin: '0 2px' }}>POST</Tag>, <Tag color="orange" style={{ margin: '0 2px' }}>PUT</Tag>, or <Tag color="red" style={{ margin: '0 2px' }}>DELETE</Tag> are write operations that require higher permissions.
                </Typography.Paragraph>
                <Table
                  columns={protectedRouteColumns}
                  dataSource={routes}
                  rowKey={(record) => `${record.permission}-${record.path}`}
                  loading={routesLoading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} routes`,
                  }}
                  scroll={{ x: 'max-content' }}
                  size="small"
                />
              </>
            ),
          },
        ]}
      />

      {/* Create/Edit Plan Modal */}
      <Modal
        title={editingPlan ? "Edit Plan" : "Create Plan"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={700}
        style={{ maxWidth: '95vw' }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Plan Name (Internal)"
            rules={[{ required: true, message: "Please enter plan name" }]}
          >
            <Input 
              placeholder="e.g., FREE, PRO, PROPLUS" 
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                form.setFieldsValue({ name: value });
              }}
            />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true, message: "Please enter display name" }]}
          >
            <Input placeholder="e.g., Free, Pro, Pro Plus" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={2} placeholder="Plan description" />
          </Form.Item>

          <Form.Item
            name="features"
            label="Features"
            extra="Add features that will be displayed on the upgrade page"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Type a feature and press Enter"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price (USD)"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            label="Duration"
            required
          >
            <Input.Group compact>
              <Form.Item
                name="durationValue"
                noStyle
                rules={[{ required: true, message: "Please enter duration" }]}
              >
                <InputNumber min={0} style={{ width: '70%' }} placeholder="30" />
              </Form.Item>
              <Form.Item
                name="durationUnit"
                noStyle
                initialValue="minutes"
              >
                <Select style={{ width: '30%' }}>
                  <Select.Option value="minutes">Minutes</Select.Option>
                  <Select.Option value="hours">Hours</Select.Option>
                  <Select.Option value="days">Days</Select.Option>
                </Select>
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
