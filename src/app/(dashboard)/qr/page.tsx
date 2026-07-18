"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  Tag,
  message,
  Popconfirm,
  Empty,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  LinkOutlined,
  CopyOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { qrApi } from "@/lib/api";
import { useTheme } from "@/components/providers/AntdProvider";
import { useSession } from "next-auth/react";
import type { QRCode } from "@/types";
import type { ColumnsType } from "antd/es/table";

export default function QRPage() {
  const { isDark } = useTheme();
  const { data: session } = useSession();
  const user = session?.user;
  const [messageApi, contextHolder] = message.useMessage();

  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/public/user?userId=${(user as any)?.id || ""}`;

  // ─── Load QR codes ───
  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const res = await qrApi.list();
      setQRCodes(res.data?.data || []);
    } catch {
      messageApi.error("Failed to load QR codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, []);

  // ─── Create QR ───
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await qrApi.create({ name: values.name, url: values.url || publicUrl });
      messageApi.success("QR code created");
      setCreateModalOpen(false);
      form.resetFields();
      loadQRCodes();
    } catch (err: any) {
      if (err?.response?.data?.message) {
        const msg = err.response.data.message;
        messageApi.error(Array.isArray(msg) ? msg.join(", ") : msg);
      }
    } finally {
      setCreating(false);
    }
  };

  // ─── Delete QR ───
  const handleDelete = async (id: string) => {
    try {
      await qrApi.remove(id);
      messageApi.success("QR code deleted");
      loadQRCodes();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  // ─── Download QR as PNG ───
  const handleDownload = (qr: QRCode, sourceId?: string) => {
    const svgEl = document.getElementById(sourceId || `qr-table-${qr.id}`)?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${qr.name.replace(/\s+/g, "_")}_qr.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // ─── Copy URL ───
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    messageApi.success("URL copied");
  };

  // ─── Table columns ───
  const columns: ColumnsType<QRCode> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: any, i: number) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: "QR Code",
      key: "qr",
      width: 80,
      render: (_: any, record: QRCode) => (
        <div
          id={`qr-table-${record.id}`}
          style={{ cursor: "pointer" }}
          onClick={() => { setSelectedQR(record); setViewModalOpen(true); }}
        >
          <QRCodeSVG value={record.url} size={48} />
        </div>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <Typography.Text strong>{name}</Typography.Text>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 13, cursor: "pointer" }}
            onClick={() => handleCopyUrl(url)}
          >
            <LinkOutlined style={{ marginRight: 4 }} />
            {url}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: any, record: QRCode) => (
        <Space size={4}>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => { setSelectedQR(record); setViewModalOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Download PNG">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="Copy URL">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyUrl(record.url)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this QR code?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Card
          bordered={false}
          style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <QrcodeOutlined style={{ marginRight: 8 }} />
                QR Codes
              </Typography.Title>
              <Typography.Text type="secondary">
                Create and manage QR codes for your public profile.
              </Typography.Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              New QR Code
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={qrCodes}
            rowKey="id"
            loading={loading}
            pagination={{ current: pagination.current, pageSize: pagination.pageSize, showSizeChanger: false, onChange: (page, size) => setPagination({ current: page, pageSize: size }) }}
            locale={{ emptyText: <Empty description="No QR codes yet" /> }}
            scroll={{ x: "max-content" }}
          />
        </Card>
      </div>

      {/* ─── Create Modal ─── */}
      <Modal
        title={<span><QrcodeOutlined /> Create QR Code</span>}
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        confirmLoading={creating}
        okText="Create"
        width={480}
        style={{ maxWidth: "90vw" }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g. My Profile, Business Card" />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: "Please enter a URL" }]}
          >
            <Input
              placeholder="https://example.com/profile"
              addonBefore={<LinkOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── View Modal ─── */}
      <Modal
        title={<span><QrcodeOutlined /> {selectedQR?.name}</span>}
        open={viewModalOpen}
        onCancel={() => { setViewModalOpen(false); setSelectedQR(null); }}
        footer={null}
        width={400}
        style={{ maxWidth: "90vw" }}
        styles={{ body: { textAlign: "center", padding: "24px 16px" } }}
      >
        {selectedQR && (
          <>
            <div style={{
              display: "inline-block",
              padding: 20,
              background: "#fff",
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}>
              <div id={`qr-modal-${selectedQR.id}`}>
                <QRCodeSVG value={selectedQR.url} size={220} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <LinkOutlined style={{ marginRight: 4 }} />
                Links to:
              </Typography.Text>
              <div style={{ fontSize: 13, wordBreak: "break-all", marginTop: 4 }}>
                {selectedQR.url}
              </div>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(selectedQR, `qr-modal-${selectedQR.id}`)}
              >
                Download PNG
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopyUrl(selectedQR.url)}
              >
                Copy URL
              </Button>
            </Space>
          </>
        )}
      </Modal>
    </>
  );
}
