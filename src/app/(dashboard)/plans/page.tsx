"use client";

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Tag, message, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
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

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    loadPlans();
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

  const handleCreate = () => {
    setEditingPlan(null);
    form.resetFields();
    form.setFieldsValue({
      currency: "USD",
      isActive: true,
      price: 0,
      durationDays: 30,
    });
    setModalOpen(true);
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      durationDays: plan.durationDays,
      isActive: plan.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingPlan) {
        await paymentApi.updatePlan({ id: editingPlan.id, ...values });
        messageApi.success("Plan updated");
      } else {
        await paymentApi.createPlan(values);
        messageApi.success("Plan created");
      }

      setModalOpen(false);
      loadPlans();
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
    },
    {
      title: "Price",
      key: "price",
      align: 'center' as const,
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
      filters: [...new Set(plans.map((p) => p.durationDays))].map((days) => ({
        text: days === 0 ? "30 minutes" : days === 30 ? "1 month" : days === 365 ? "1 year" : `${days} days`,
        value: days,
      })),
      onFilter: (value: any, record: any) => record.durationDays === value,
      render: (days: number) => {
        if (days === 0) return <Tag>30 minutes</Tag>;
        if (days === 30) return <Tag color="blue">1 month</Tag>;
        if (days === 365) return <Tag color="gold">1 year</Tag>;
        return <Tag>{days} days</Tag>;
      },
    },
    {
      title: "Status",
      key: "isActive",
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
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Edit">
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

  return (
    <div>
      {contextHolder}
      
      <Space style={{ marginBottom: 16 }}>
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
      </Space>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          getCheckboxProps: (record: any) => ({
            disabled: record._count?.subscriptions > 0,
          }),
        }}
      />

      <Modal
        title={editingPlan ? "Edit Plan" : "Create Plan"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Plan Name (Internal)"
            rules={[{ required: true, message: "Please enter plan name" }]}
          >
            <Input placeholder="e.g., FREE, PRO, PROPLUS" />
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
            name="durationDays"
            label="Duration (days)"
            rules={[{ required: true, message: "Please enter duration" }]}
            extra="Use 0 for 30 minutes trial"
          >
            <InputNumber min={0} style={{ width: "100%" }} placeholder="30" />
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
