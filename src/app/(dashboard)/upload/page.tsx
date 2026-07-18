"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  Select,
  Button,
  Upload,
  Typography,
  Space,
  Tag,
  message,
  Image,
  Divider,
  Grid,
  Modal,
  Input,
  Popconfirm,
  Empty,
  Spin,
  notification,
  Slider,
} from "antd";
import {
  InboxOutlined,
  UploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  ScissorOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
} from "@ant-design/icons";
import dynamic from "next/dynamic";
import { uploadApi } from "@/lib/api";
import { useTheme } from "@/components/providers/AntdProvider";
import { useSession } from "next-auth/react";
import { getCroppedImg } from "@/lib/cropImage";
import type { UploadFile } from "antd";
import type { Folder, UploadedFile } from "@/types";

const Cropper = dynamic(() => import("react-easy-crop").then(mod => mod.default), { ssr: false });

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

/**
 * Upload page — Admin file upload to Supabase Storage.
 *
 * Features:
 * - Folder management: create/delete custom folders (admin only)
 * - Multi-file upload: max 10 files per batch (admin), 1 file (user avatar)
 * - Crop modal: drag + resize crop area before upload
 * - Gallery: lazy-loaded images with click-to-preview
 * - Notification: error/success toasts for storage issues
 */
export default function UploadPage() {
  const { isDark } = useTheme();
  const screens = useBreakpoint();
  const [api, contextHolder] = notification.useNotification();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "ADMIN";

  // ─── State ───
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<UploadedFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Folder create modal
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: "", displayName: "", description: "" });
  const [folderCreating, setFolderCreating] = useState(false);

  // ─── Load folders ───
  const loadFolders = useCallback(async () => {
    try {
      const res = await uploadApi.listFolders();
      const data = res.data?.data || [];
      setFolders(data);
      if (!selectedFolder && data.length > 0) {
        if (!isAdmin) {
          const avatarFolder = data.find((f) => f.name === "avatars");
          setSelectedFolder(avatarFolder?.name || data[0].name);
        } else {
          setSelectedFolder(data[0].name);
        }
      }
    } catch (err: any) {
      api.error({
        message: "Failed to load folders",
        description: err?.response?.data?.message || "Could not fetch folder list",
        placement: "topRight",
      });
    }
  }, [selectedFolder, isAdmin, api]);

  // ─── Load gallery ───
  const loadGallery = useCallback(async () => {
    if (!selectedFolder) { setGalleryFiles([]); return; }
    setGalleryLoading(true);
    try {
      const res = await uploadApi.listFiles(selectedFolder);
      setGalleryFiles(res.data?.data || []);
    } catch (err: any) {
      api.error({
        message: "Failed to load gallery",
        description: err?.response?.data?.message || `Could not list files in "${selectedFolder}"`,
        placement: "topRight",
      });
      setGalleryFiles([]);
    } finally {
      setGalleryLoading(false);
    }
  }, [selectedFolder, api]);

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { loadGallery(); }, [selectedFolder]);

  // ─── File selected → open crop modal ───
  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setCropImage(url);
    setPendingFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCropModalOpen(true);
  };

  const onCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // ─── Confirm crop → upload ───
  const handleCropConfirm = async () => {
    if (!pendingFile || !croppedAreaPixels || !selectedFolder) return;

    // Output dimensions based on folder
    const isAvatar = selectedFolder === "avatars";
    const outputW = isAvatar ? 512 : 256;
    const outputH = isAvatar ? 512 : 256;

    try {
      const { blob } = await getCroppedImg(cropImage, croppedAreaPixels, outputW, outputH);
      const croppedFile = new File([blob], pendingFile.name, { type: "image/jpeg" });

      setCropModalOpen(false);
      setUploading(true);

      const res = await uploadApi.upload(selectedFolder, [croppedFile]);
      const data = res.data?.data;
      const uploaded = data?.uploaded || [];
      const errors = data?.errors || [];

      if (uploaded.length > 0) {
        api.success({
          message: "Upload successful",
          description: `${uploaded.length} file(s) uploaded to "${selectedFolder}"`,
          placement: "topRight",
          duration: 3,
        });
      }
      if (errors.length > 0) {
        api.warning({
          message: "Upload failed",
          description: errors.join("\n"),
          placement: "topRight",
          duration: 6,
        });
      }

      loadGallery();
    } catch (err: any) {
      api.error({
        message: "Crop/Upload failed",
        description: err?.message || "Something went wrong",
        placement: "topRight",
      });
    } finally {
      setUploading(false);
      setPendingFile(null);
      URL.revokeObjectURL(cropImage);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setPendingFile(null);
    URL.revokeObjectURL(cropImage);
  };

  // ─── Delete file ───
  const handleDeleteFile = async (filename: string) => {
    try {
      await uploadApi.deleteFile(selectedFolder, filename);
      api.success({ message: "File deleted", description: `"${filename}" removed`, placement: "topRight", duration: 2 });
      loadGallery();
    } catch (err: any) {
      api.error({ message: "Delete failed", description: err?.response?.data?.message, placement: "topRight" });
    }
  };

  const handleCopyUrl = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    message.success("URL copied");
  };

  // ─── Folder CRUD ───
  const handleCreateFolder = async () => {
    if (!folderForm.name || !folderForm.displayName) { message.warning("Name required"); return; }
    setFolderCreating(true);
    try {
      await uploadApi.createFolder(folderForm);
      api.success({ message: "Folder created", description: `"${folderForm.displayName}" ready`, placement: "topRight" });
      setFolderModalOpen(false);
      setFolderForm({ name: "", displayName: "", description: "" });
      loadFolders();
    } catch (err: any) {
      api.error({ message: "Create failed", description: err?.response?.data?.message, placement: "topRight" });
    } finally { setFolderCreating(false); }
  };

  const handleDeleteFolder = async (name: string) => {
    try {
      await uploadApi.deleteFolder(name);
      api.success({ message: "Folder deleted", description: `"${name}" removed`, placement: "topRight" });
      if (selectedFolder === name) setSelectedFolder("");
      loadFolders();
    } catch (err: any) {
      api.error({ message: "Delete failed", description: err?.response?.data?.message, placement: "topRight" });
    }
  };

  const selectedFolderData = folders.find((f) => f.name === selectedFolder);
  const visibleFolders = isAdmin ? folders : folders.filter((f) => f.name === "avatars");
  const isAvatarFolder = selectedFolder === "avatars";
  const outputSize = isAvatarFolder ? 512 : 256;

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* ─── Folder Selector ─── */}
        <Card bordered={false} style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <FolderOpenOutlined style={{ marginRight: 8 }} />
                {isAdmin ? "Upload Files" : "My Avatar"}
              </Title>
              <Text type="secondary">
                {isAdmin ? "Select a folder, pick an image, crop it, then upload." : "Upload your profile picture. JPEG or PNG, max 3MB."}
              </Text>
            </div>
            {isAdmin && <Button icon={<PlusOutlined />} onClick={() => setFolderModalOpen(true)}>New Folder</Button>}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Text strong style={{ display: "block", marginBottom: 6 }}>Folder</Text>
              {isAdmin ? (
                <Select
                  value={selectedFolder || undefined}
                  onChange={setSelectedFolder}
                  placeholder="Select a folder"
                  style={{ width: "100%" }}
                  options={visibleFolders.map((f) => ({
                    label: <Space>{f.isSystem ? <FolderOutlined /> : <FolderOpenOutlined />}{f.displayName}{f.isSystem && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>System</Tag>}</Space>,
                    value: f.name,
                  }))}
                />
              ) : (
                <div style={{ padding: "6px 12px", borderRadius: 8, background: isDark ? "#252536" : "#f5f5f7", display: "flex", alignItems: "center", gap: 8 }}>
                  <FolderOutlined /><Text>Avatar (Profile Pictures)</Text><Tag color="blue" style={{ margin: 0, fontSize: 10 }}>System</Tag>
                </div>
              )}
            </div>
            {selectedFolderData && <div style={{ flex: 1, minWidth: 200 }}><Text type="secondary" style={{ fontSize: 12 }}>{selectedFolderData.description || "Custom folder"}</Text></div>}
            {isAdmin && selectedFolder && !selectedFolderData?.isSystem && (
              <Popconfirm title="Delete this folder?" description="All files will be removed." onConfirm={() => handleDeleteFolder(selectedFolder)} okText="Delete" okType="danger">
                <Button danger icon={<DeleteOutlined />}>Delete Folder</Button>
              </Popconfirm>
            )}
          </div>
        </Card>

        {selectedFolder && (
          <>
            {/* ─── Upload Area ─── */}
            <Card bordered={false} style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff", marginBottom: 16 }}>
              <Dragger
                multiple={isAdmin}
                accept=".jpg,.jpeg,.png"
                fileList={fileList}
                onChange={({ fileList: newFileList }) => {
                  const limit = isAdmin ? 10 : 1;
                  if (newFileList.length > limit) {
                    api.warning({ message: isAdmin ? "Too many files" : "Only 1 file", description: isAdmin ? "Max 10 files." : "Upload 1 avatar at a time.", placement: "topRight" });
                    setFileList(newFileList.slice(0, limit));
                  } else {
                    setFileList(newFileList);
                  }
                }}
                beforeUpload={(file) => {
                  // Open crop modal instead of auto-uploading
                  if (file instanceof File) handleFileSelect(file);
                  return false; // prevent auto upload
                }}
                showUploadList={false}
                style={{ borderRadius: 12, background: isDark ? "#252536" : "#fafafa" }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: "#4f46e5" }} /></p>
                <p className="ant-upload-text">
                  {isAdmin ? `Click or drag images to crop & upload to "${selectedFolderData?.displayName || selectedFolder}"` : "Click or drag an image to crop & upload your avatar"}
                </p>
                <p className="ant-upload-hint">
                  JPEG/PNG. Max 3MB. {isAdmin ? "Up to 10 files. You'll crop each one before upload." : "1 file only. Crop before upload."}
                </p>
              </Dragger>
            </Card>

            {/* ─── Gallery ─── */}
            <Card bordered={false} style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 16 }}>
                <Space>
                  <Title level={5} style={{ margin: 0 }}>Gallery</Title>
                  <Tag>{galleryFiles.length} files</Tag>
                  {selectedFolderData && <Tag color="purple">{outputSize}×{outputSize}px</Tag>}
                </Space>
                <Button size="small" onClick={loadGallery}>Refresh</Button>
              </div>
              {galleryLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /><div style={{ marginTop: 12, color: isDark ? "#a0a0b0" : "#6e6e73" }}>Loading...</div></div>
              ) : galleryFiles.length === 0 ? (
                <Empty description="No files uploaded yet" />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${screens.md ? 160 : 120}px, 1fr))`, gap: 12 }}>
                  {galleryFiles.map((file, index) => (
                    <GalleryItem key={file.name} file={file} index={index} isDark={isDark} onCopyUrl={handleCopyUrl} onDelete={handleDeleteFile} copiedIndex={copiedIndex} />
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {!selectedFolder && folders.length > 0 && (
          <Card bordered={false} style={{ borderRadius: 16, background: isDark ? "#1e1e2e" : "#ffffff" }}>
            <Empty description="Select a folder to get started" />
          </Card>
        )}

        {/* ─── Crop Modal ─── */}
        <Modal
          title={<Space><ScissorOutlined /> Crop Image</Space>}
          open={cropModalOpen}
          onOk={handleCropConfirm}
          onCancel={handleCropCancel}
          okText="Upload Cropped"
          confirmLoading={uploading}
          width={520}
          style={{ maxWidth: "90vw" }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ position: "relative", width: "100%", height: "clamp(250px, 50vw, 400px)", background: "#1a1a2e" }}>
            {cropImage && (
              // @ts-expect-error react-easy-crop types
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{ containerStyle: { borderRadius: 8 } }}
              />
            )}
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <RotateLeftOutlined style={{ color: isDark ? "#a0a0b0" : "#6e6e73" }} />
              <Text style={{ minWidth: 40, textAlign: "center", fontSize: 13 }}>{rotation}°</Text>
              <Slider
                min={0}
                max={360}
                value={rotation}
                onChange={setRotation}
                style={{ flex: 1 }}
              />
              <RotateRightOutlined style={{ color: isDark ? "#a0a0b0" : "#6e6e73" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 13 }}>Zoom</Text>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={setZoom}
                style={{ flex: 1 }}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Output: {outputSize}×{outputSize}px JPEG. Drag to position, scroll/pinch to zoom.
            </Text>
          </div>
        </Modal>

        {/* ─── Create Folder Modal ─── */}
        {isAdmin && (
          <Modal title="Create New Folder" open={folderModalOpen} onOk={handleCreateFolder} confirmLoading={folderCreating} onCancel={() => setFolderModalOpen(false)}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <div>
                <Text strong style={{ display: "block", marginBottom: 4 }}>Folder Name (URL-safe)</Text>
                <Input placeholder="e.g. banner, product" value={folderForm.name} onChange={(e) => setFolderForm((p) => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))} />
                <Text type="secondary" style={{ fontSize: 11 }}>Lowercase letters, numbers, underscore, dash.</Text>
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: 4 }}>Display Name</Text>
                <Input placeholder="e.g. Banner Images" value={folderForm.displayName} onChange={(e) => setFolderForm((p) => ({ ...p, displayName: e.target.value }))} />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: 4 }}>Description (optional)</Text>
                <Input.TextArea rows={2} placeholder="What is this folder for?" value={folderForm.description} onChange={(e) => setFolderForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </Space>
          </Modal>
        )}
      </div>
    </>
  );
}

// ─── Gallery Item with lazy loading ───

function GalleryItem({ file, index, isDark, onCopyUrl, onDelete, copiedIndex }: {
  file: UploadedFile; index: number; isDark: boolean;
  onCopyUrl: (url: string, index: number) => void;
  onDelete: (filename: string) => void;
  copiedIndex: number | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ borderRadius: 12, overflow: "hidden", background: isDark ? "#252536" : "#f5f5f7", border: `1px solid ${isDark ? "#2e2e40" : "#e5e5ea"}`, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ width: "100%", paddingTop: "100%", position: "relative", background: isDark ? "#1a1a2e" : "#eee" }}>
        {inView ? (
          <>
            {!loaded && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="small" /></div>}
            <Image src={file.url} alt={file.name} preview={{ mask: "Click to preview" }} loading="lazy" onLoad={() => setLoaded(true)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PictureOutlined style={{ fontSize: 24, color: isDark ? "#3a3a50" : "#d0d0d0" }} />
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isDark ? "#e0e0e8" : "#1d1d1f" }} title={file.name}>
          {file.name.replace(/_\d+\.jpg$/, "")}
        </div>
        <div style={{ fontSize: 11, color: isDark ? "#a0a0b0" : "#6e6e73", marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          <Button size="small" type="text" icon={copiedIndex === index ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
            onClick={(e) => { e.stopPropagation(); onCopyUrl(file.url, index); }} />
          <Popconfirm title="Delete?" onConfirm={(e) => { e?.stopPropagation(); onDelete(file.name); }} okText="Delete" okType="danger">
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}
