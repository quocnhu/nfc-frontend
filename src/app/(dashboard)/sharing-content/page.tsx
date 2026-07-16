"use client";

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from "@ant-design/icons";
import { sharingApi } from "@/lib/api";
import { formatDate } from "@/utils/helpers";
import type { SharingContent } from "@/types";

export default function SharingContentPage() {
  const [items, setItems] = useState<SharingContent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SharingContent | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const load = async () => {
    setLoading(true);
    try {
      const res = await sharingApi.list();
      setItems(res.data?.data || []);
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
        await sharingApi.update({ id: editingItem.id, ...values });
        messageApi.success("Updated");
      } else {
        await sharingApi.create(values);
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
    { title: "#", key: "index", width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: "Item Name", dataIndex: "itemName", key: "itemName", filterSearch: true,
      filters: [...new Set(items.map((i) => i.itemName))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: SharingContent) => record.itemName.includes(value),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      filterSearch: true,
      filters: items.map((i) => ({ text: i.url, value: i.url })),
      onFilter: (value: any, record: SharingContent) => record.url === value,
      render: (url: string) => (
        <Typography.Link href={url} target="_blank">
          <LinkOutlined /> {url}
        </Typography.Link>
      ),
    },
    { title: "Icon", dataIndex: "icon", key: "icon", filterSearch: true,
      filters: [...new Set(items.map((i) => i.icon))].map((n) => ({ text: n, value: n })),
      onFilter: (value: any, record: SharingContent) => record.icon === value,
    },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", render: formatDate },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: SharingContent) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Create
      </Button>
      <Table loading={loading} columns={columns} dataSource={items} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} items` }} />

      <Modal
        title={editingItem ? "Edit" : "Create"}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="itemName" label="Item Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. YouTube" />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true, type: "url" }]}>
            <Input placeholder="https://youtube.com/@user" />
          </Form.Item>
          <Form.Item name="icon" label="Icon" rules={[{ required: true }]}>
            <Input placeholder="e.g. youtube" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
