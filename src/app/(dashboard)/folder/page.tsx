"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, Typography, Button, Table, Tag, Space, Upload,
  Empty, Spin, Modal, Progress, Popconfirm, message, Breadcrumb, Input,
} from "antd";
import {
  FolderOpenOutlined, UploadOutlined, DeleteOutlined,
  CopyOutlined, CheckCircleOutlined, DownloadOutlined,
  PictureOutlined, FolderOutlined, ArrowLeftOutlined,
  EyeOutlined, FileOutlined, CloudOutlined, FolderAddOutlined,
} from "@ant-design/icons";
import { userdataApi } from "@/lib/api";
import { useTheme } from "@/components/providers/AntdProvider";
import type { ColumnsType } from "antd/es/table";

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface BrowseItem {
  name: string;
  type: "folder" | "file";
  path: string;
  url?: string;
  size: number;
  created_at: string;
  mimetype?: string;
  isAvatar?: boolean;
}

interface StorageUsage {
  usedBytes: number;
  limitBytes: number;
  usedMB: string;
  limitMB: string;
  percent: number;
  isAdmin: boolean;
}

export default function FolderPage() {
  const { isDark } = useTheme();
  const [api, contextHolder] = message.useMessage();

  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<BrowseItem | null>(null);

  const loadStorage = useCallback(async () => {
    try {
      const res = await userdataApi.storageUsage();
      if (res.data?.data) setStorage(res.data.data);
    } catch {
      // silent
    }
  }, []);

  const loadFolder = async (path: string) => {
    setLoading(true);
    try {
      const res = await userdataApi.browse(path);
      setCurrentPath(res.data?.data?.currentPath || path);
      setItems(res.data?.data?.items || []);
    } catch {
      api.error("Failed to load folder");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFolder(""); loadStorage(); }, []);

  const navigateInto = (folderPath: string) => {
    loadFolder(folderPath);
  };

  const navigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    loadFolder(parts.join("/"));
  };

  const handleUpload = async (file: File) => {
    setUploadModalOpen(false);
    setUploading(true);
    setUploadProgress(0);

    try {
      await userdataApi.uploadFiles([file], (percent) => {
        setUploadProgress(percent);
      }, currentPath || undefined);
      api.success("File uploaded successfully");
      loadFolder(currentPath);
      loadStorage();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Upload failed";
      api.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
    return false;
  };

  const handleDelete = async (item: BrowseItem) => {
    try {
      const pathParts = currentPath ? currentPath : undefined;
      await userdataApi.deleteFile(item.name, pathParts);
      api.success("Deleted successfully");
      loadFolder(currentPath);
      loadStorage();
    } catch (err: any) {
      api.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleDeleteFolder = async (item: BrowseItem) => {
    try {
      await userdataApi.deleteFolder(item.path);
      api.success("Folder deleted");
      loadFolder(currentPath);
      loadStorage();
    } catch (err: any) {
      api.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await userdataApi.createFolder(newFolderName.trim(), currentPath || undefined);
      api.success("Folder created");
      setNewFolderOpen(false);
      setNewFolderName("");
      loadFolder(currentPath);
    } catch (err: any) {
      api.error(err?.response?.data?.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDownload = async (item: BrowseItem) => {
    if (!item.url) return;
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      api.error("Download failed");
    }
  };

  const openPreview = (item: BrowseItem) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  // Breadcrumb parts
  const breadcrumbParts = currentPath ? currentPath.split("/").filter(Boolean) : [];

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const columns: ColumnsType<BrowseItem> = [
    {
      title: "#",
      width: 50,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record: BrowseItem) => (
        <Space
          style={{ cursor: record.type === "folder" ? "pointer" : "default" }}
          onClick={() => record.type === "folder" && navigateInto(record.path)}
        >
          {record.type === "folder" ? (
            <FolderOutlined style={{ color: "#faad14", fontSize: 16 }} />
          ) : record.mimetype?.startsWith("image/") && record.url ? (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                overflow: "hidden",
                border: `1px solid ${isDark ? "#2e2e40" : "#e5e5ea"}`,
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={(e) => { e.stopPropagation(); openPreview(record); }}
            >
              <img src={record.url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <FileOutlined style={{ color: isDark ? "#888" : "#999", fontSize: 16 }} />
          )}
          <Text
            strong={record.type === "folder"}
            style={{
              color: record.type === "folder" ? (isDark ? "#fadb14" : "#1677ff") : undefined,
              cursor: record.type === "folder" ? "pointer" : "default",
            }}
          >
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_: any, record: BrowseItem) => (
        record.type === "folder" ? (
          <Tag color="gold">Folder</Tag>
        ) : (
          <Tag>{record.mimetype?.split("/")[1]?.toUpperCase() || "File"}</Tag>
        )
      ),
    },
    {
      title: "Size",
      key: "size",
      width: 100,
      render: (_: any, record: BrowseItem) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.type === "folder" ? "—" : formatSize(record.size)}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: any, record: BrowseItem) => {
        if (record.type === "folder") {
          return (
            <Space size={4}>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<FolderOutlined />}
                onClick={() => navigateInto(record.path)}
              >
                Open
              </Button>
              <Popconfirm
                title="Delete this folder and its contents?"
                onConfirm={() => handleDeleteFolder(record)}
                okText="Delete"
                okType="danger"
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          );
        }

        return (
          <Space size={4}>
            {record.mimetype?.startsWith("image/") && (
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => openPreview(record)}
                title="View"
              />
            )}
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              title="Download"
            />
            <Button
              size="small"
              type="text"
              icon={copiedIndex === record.path ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
              onClick={() => { navigator.clipboard.writeText(record.url || ""); setCopiedIndex(record.path); setTimeout(() => setCopiedIndex(null), 2000); api.success("URL copied"); }}
              title="Copy URL"
            />
            <Popconfirm
              title="Delete this file?"
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              okType="danger"
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const folderItems = items.filter((i) => i.type === "folder");
  const fileItems = items.filter((i) => i.type === "file");

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <Card
          bordered={false}
          style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff", marginBottom: 16 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title level={4} style={{ margin: 0 }}>
                <FolderOpenOutlined style={{ marginRight: 8 }} />
                My Files
              </Title>
              {/* Breadcrumb */}
              <Breadcrumb
                style={{ marginTop: 4 }}
                items={[
                  {
                    title: (
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => loadFolder("")}
                      >
                        Home
                      </span>
                    ),
                  },
                  ...breadcrumbParts.map((part, i) => ({
                    title: (
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => loadFolder(breadcrumbParts.slice(0, i + 1).join("/"))}
                      >
                        {part}
                      </span>
                    ),
                  })),
                ]}
              />
              {/* Capacity Tube */}
              {storage && !storage.isAdmin && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.02)",
                    border: `1px solid ${isDark ? "#2e2e40" : "#f0f0f0"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <CloudOutlined style={{ fontSize: 14, color: storage.percent > 80 ? "#ff4d4f" : "#4f46e5" }} />
                    <Text style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#ccc" : "#333" }}>
                      Storage
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? "#888" : "#999", marginLeft: "auto" }}>
                      {storage.usedMB} / {storage.limitMB} MB
                    </Text>
                  </div>
                  <Progress
                    percent={storage.percent}
                    size={8}
                    strokeColor={
                      storage.percent > 80
                        ? { "0%": "#faad14", "100%": "#ff4d4f" }
                        : { "0%": "#4f46e5", "100%": "#818cf8" }
                    }
                    trailColor={isDark ? "#2a2a3a" : "#f0f0f0"}
                    showInfo={false}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: isDark ? "#888" : "#aaa" }}>
                      {storage.percent}%
                    </Text>
                  </div>
                </div>
              )}
            </div>
            <Space>
              {currentPath && (
                <Button icon={<ArrowLeftOutlined />} onClick={navigateUp}>
                  Back
                </Button>
              )}
              <Button
                icon={<FolderAddOutlined />}
                onClick={() => setNewFolderOpen(true)}
                disabled={uploading}
              >
                New Folder
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadModalOpen(true)}
                disabled={uploading}
              >
                Upload
              </Button>
            </Space>
          </div>
        </Card>

        {/* Content */}
        <Card
          bordered={false}
          style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff" }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : items.length === 0 ? (
            <Empty description="Empty folder. Upload your first file." />
          ) : (
            <>
              {folderItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <Text strong style={{ display: "block", marginBottom: 10, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: isDark ? "#888" : "#999" }}>
                    <FolderOutlined style={{ marginRight: 6 }} /> Folders ({folderItems.length})
                  </Text>
                  <Table
                    columns={columns.filter((c) => c.key !== "size")}
                    dataSource={folderItems}
                    pagination={false}
                    rowKey="path"
                    size="small"
                    scroll={{ x: 'max-content' }}
                    onRow={(record) => ({
                      onClick: () => navigateInto(record.path),
                      style: { cursor: "pointer" },
                    })}
                  />
                </div>
              )}
              {fileItems.length > 0 && (
                <div>
                  <Text strong style={{ display: "block", marginBottom: 10, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, color: isDark ? "#888" : "#999" }}>
                    <FileOutlined style={{ marginRight: 6 }} /> Files
                  </Text>
                  <Table
                    columns={columns}
                    dataSource={fileItems}
                    pagination={false}
                    rowKey="path"
                    size="small"
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Upload Modal */}
        <Modal
          title="Upload File"
          open={uploadModalOpen}
          onCancel={() => setUploadModalOpen(false)}
          footer={null}
          width={400}
          style={{ maxWidth: '90vw' }}
        >
          <Dragger
            multiple={false}
            fileList={[]}
            beforeUpload={(file) => {
              handleUpload(file);
              return false;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <PictureOutlined style={{ color: "#4f46e5" }} />
            </p>
            <p className="ant-upload-text">Click or drag file to upload</p>
            <p className="ant-upload-hint">
              Any format, max {storage?.isAdmin ? "1GB" : "10MB"} per file.
            </p>
          </Dragger>
        </Modal>

        {/* Upload Progress */}
        <Modal
          title="Uploading..."
          open={uploading}
          footer={null}
          closable={false}
          width={360}
          style={{ maxWidth: '90vw' }}
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Progress type="circle" percent={uploadProgress} size={100} strokeColor="#4f46e5" />
            <div style={{ marginTop: 16, fontSize: 14, color: "#6e6e73" }}>
              Uploading... {uploadProgress}%
            </div>
          </div>
        </Modal>

        {/* Preview Modal */}
        <Modal
          open={previewOpen}
          onCancel={() => { setPreviewOpen(false); setPreviewItem(null); }}
          footer={null}
          width={600}
          style={{ maxWidth: '90vw' }}
          styles={{ body: { padding: 0, textAlign: "center" } }}
        >
          {previewItem?.url && (
            <>
              <img
                src={previewItem.url}
                alt={previewItem.name}
                style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain" }}
              />
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${isDark ? "#2e2e40" : "#f0f0f0"}` }}>
                <Text ellipsis style={{ fontSize: 12 }} title={previewItem.name}>{previewItem.name}</Text>
              </div>
            </>
          )}
        </Modal>
      </div>
    </>
  );
}
