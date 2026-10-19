"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, Typography, Tag, Divider, Row, Col, Modal, Upload, Slider, message, Progress, Button } from "antd";
import {
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  IdcardOutlined,
  CameraOutlined,
  PictureOutlined,
  ScissorOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/AntdProvider";
import { userdataApi } from "@/lib/api";
import { extractApiError } from "@/lib/api-error";
import { useAvatarSync } from "@/hooks/useAvatarSync";
import { useAvatar } from "@/components/providers/AvatarProvider";
import { getCroppedImg } from "@/lib/cropImage";
import { InfoRow } from "@/components/ui";

const Cropper = dynamic(() => import("react-easy-crop").then(mod => mod.default), { ssr: false });

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#f5222d",
  VIP: "#faad14",
  USER: "#1677ff",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const { uploadOwnAvatar, selectAvatar } = useAvatarSync();
  const { avatarUrl: liveAvatarUrl, setAvatarUrl } = useAvatar();
  const router = useRouter();
  const user = session?.user;
  const { isDark } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();

  const [copied, setCopied] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarHistory, setAvatarHistory] = useState<{ name: string; url: string; path: string }[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleColor = ROLE_COLORS[user?.role || ""] || "#4f46e5";

  useEffect(() => {
    if (!(user as any)?.id) return;
    userdataApi
      .listAdminAvatars((user as any).id)
      .then((res) => setAvatarHistory(res.data?.data || []))
      .catch(() => setAvatarHistory([]));
  }, [(user as any)?.id]);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setCropImage(url);
    setPendingFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFilePickerOpen(false);
    setCropModalOpen(true);
    return false;
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!pendingFile || !croppedAreaPixels) return;

    try {
      const { blob } = await getCroppedImg(cropImage, croppedAreaPixels, 512, 512);
      const croppedFile = new File([blob], pendingFile.name, { type: "image/jpeg" });

      setCropModalOpen(false);
      setUploading(true);
      setUploadProgress(0);

      const avatarUrl = await uploadOwnAvatar(croppedFile, (percent) => {
        setUploadProgress(percent);
      });

      messageApi.success("Avatar updated successfully");
      if ((user as any)?.id) {
        userdataApi
          .listAdminAvatars((user as any).id)
          .then((r) => setAvatarHistory(r.data?.data || []))
          .catch((err) => {
            console.error("Failed to refresh avatar history:", err);
            messageApi.error(extractApiError(err, "Failed to refresh avatar history"));
          });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Upload failed";
      messageApi.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setPendingFile(null);
      URL.revokeObjectURL(cropImage);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setPendingFile(null);
    URL.revokeObjectURL(cropImage);
  };

  const handleSelectExistingAvatar = async (filename: string) => {
    if (!(user as any)?.id) return;
    try {
      await selectAvatar((user as any).id, filename);
      messageApi.success("Avatar updated");
      setFilePickerOpen(false);
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to select avatar");
    }
  };

  const handleDownloadQR = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `qr-${user?.name || "profile"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/public/user?userId=${(user as any)?.id || ""}`;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {contextHolder}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: isDark ? "#1e1e2e" : "#ffffff",
        }}
      >
        <div
          style={{
            margin: "-24px -24px 0",
            padding: "40px 24px 56px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 60%, #f093fb 100%)",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 16, right: 20, fontSize: 48, opacity: 0.15, color: "#fff" }}>
            <IdcardOutlined />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -48, position: "relative", zIndex: 1 }}>
          <div style={{ position: "relative", width: 96, height: 96 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: liveAvatarUrl ? "transparent" : `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 700,
                color: "#fff",
                boxShadow: `0 4px 20px ${roleColor}44`,
                border: `4px solid ${isDark ? "#1e1e2e" : "#ffffff"}`,
                overflow: "hidden",
              }}
            >
              {liveAvatarUrl ? (
                <img src={liveAvatarUrl} alt="avatar" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </div>

            <div
              onClick={() => setFilePickerOpen(true)}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: `3px solid ${isDark ? "#1e1e2e" : "#ffffff"}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <CameraOutlined style={{ color: "#fff", fontSize: 14 }} />
            </div>
          </div>

          <Typography.Title level={3} style={{ margin: "16px 0 4px", fontWeight: 700 }}>
            {user?.name || "Unknown"}
          </Typography.Title>

          <Tag color={roleColor} style={{ fontSize: 13, padding: "2px 14px", borderRadius: 20, fontWeight: 600, letterSpacing: 0.5 }}>
            {user?.role || "USER"}
          </Tag>
        </div>

        <Divider style={{ margin: "28px 0 20px" }} />

        <div style={{ padding: "0 8px" }}>
          <InfoRow icon={<UserOutlined style={{ fontSize: 18 }} />} label="Full Name" value={user?.name || "—"} iconBg="#4f46e5" />
          <InfoRow icon={<MailOutlined style={{ fontSize: 18 }} />} label="Email" value={user?.email || "—"} iconBg="#10b981" />
          <InfoRow icon={<SafetyOutlined style={{ fontSize: 18 }} />} label="Role" value={user?.role || "—"} iconBg={roleColor} />
          <InfoRow icon={<KeyOutlined style={{ fontSize: 18 }} />} label="User Type" value={(user as any)?.userType || "LOCAL"} iconBg="#08979c" />
          <InfoRow icon={<IdcardOutlined style={{ fontSize: 18 }} />} label="User ID (UUID)" value={(user as any)?.id || "—"} iconBg="#722ed1" isLast />
        </div>

        <Divider style={{ margin: "20px 0 16px" }} />
        <div style={{ padding: "0 8px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
              NFC Card Link
            </Typography.Text>
            <LinkOutlined style={{ color: "#4f46e5", fontSize: 14 }} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: isDark ? "#252536" : "#f5f5f7",
              border: isDark ? "1px solid #2e2e40" : "1px solid #e5e5ea",
            }}
          >
            <Typography.Text
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: "monospace",
                color: isDark ? "#a0a0b0" : "#6e6e73",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {publicUrl}
            </Typography.Text>
            <Button
              type="text"
              size="small"
              icon={copied ? <CheckOutlined style={{ color: "#10b981" }} /> : <CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16 }}>
            <div ref={qrRef} style={{ padding: 16, borderRadius: 12, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <QRCodeSVG value={publicUrl} size={160} />
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadQR}
              style={{ marginTop: 12 }}
            >
              Download QR Code
            </Button>
          </div>
        </div>

        {user?.permissions && user.permissions.length > 0 && (
          <>
            <Divider style={{ margin: "20px 0 16px" }} />
            <div style={{ padding: "0 8px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                  Permissions
                </Typography.Text>
                <Tag color="purple" style={{ margin: 0, borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                  {user.permissions.length}
                </Tag>
              </div>
              <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                {user.permissions.map((p: string) => (
                  <Col key={p}>
                    <Tag
                      style={{
                        borderRadius: 8,
                        padding: "3px 12px",
                        fontSize: 12,
                        background: isDark ? "#252536" : "#f5f5f7",
                        border: isDark ? "1px solid #2e2e40" : "1px solid #e5e5ea",
                      }}
                    >
                      {p}
                    </Tag>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </Card>

      <Modal title="Upload Avatar" open={filePickerOpen} onCancel={() => setFilePickerOpen(false)} footer={null} width={480} style={{ maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          {liveAvatarUrl ? (
            <img src={liveAvatarUrl} alt="current avatar" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 13, color: "#6e6e73" }}>Current avatar</div>
        </div>
        <Upload.Dragger
          accept=".jpg,.jpeg,.png"
          multiple={false}
          fileList={[]}
          beforeUpload={(file) => {
            if (file instanceof File) handleFileSelect(file);
            return false;
          }}
          showUploadList={false}
          style={{ marginBottom: avatarHistory.length > 0 ? 16 : 0 }}
        >
          <p className="ant-upload-drag-icon">
            <PictureOutlined style={{ color: "#4f46e5" }} />
          </p>
          <p className="ant-upload-text">Select a JPEG or PNG image</p>
          <p className="ant-upload-hint">You&apos;ll crop it before upload. Max 10MB, output 512x512.</p>
        </Upload.Dragger>

        {avatarHistory.length > 0 && (
          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
              Previous Avatars
            </Typography.Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10 }}>
              {avatarHistory.map((av) => {
                const isActive = liveAvatarUrl?.includes(av.name);
                return (
                  <div
                    key={av.name}
                    onClick={() => handleSelectExistingAvatar(av.name)}
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img src={av.url} alt={av.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    {isActive && (
                      <div style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "#4f46e5",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <CheckCircleOutlined style={{ color: "#fff", fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={<span><ScissorOutlined /> Crop Avatar</span>}
        open={cropModalOpen}
        onOk={handleCropConfirm}
        onCancel={handleCropCancel}
        confirmLoading={uploading}
        okText="Upload Cropped"
        width={480}
        style={{ maxWidth: "90vw" }}
        styles={{ body: { padding: 0 } }}
      >
        {uploading ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <Progress type="circle" percent={uploadProgress} size={100} strokeColor="#4f46e5" />
            <div style={{ marginTop: 16, fontSize: 14, color: "#6e6e73" }}>
              Uploading... {uploadProgress}%
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: "relative", width: "100%", height: "clamp(250px, 50vw, 400px)", background: "#1a1a2e" }}>
              {cropImage && (
                // @ts-expect-error react-easy-crop types
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{ containerStyle: { borderRadius: 8 } }}
                />
              )}
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <RotateLeftOutlined style={{ color: "#a0a0b0" }} />
                <Typography.Text style={{ minWidth: 40, textAlign: "center", fontSize: 13 }}>{rotation}°</Typography.Text>
                <Slider min={0} max={360} value={rotation} onChange={setRotation} style={{ flex: 1 }} />
                <RotateRightOutlined style={{ color: "#a0a0b0" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Typography.Text style={{ fontSize: 13 }}>Zoom</Typography.Text>
                <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} style={{ flex: 1 }} />
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Output: 512x512 JPEG. Drag to position, scroll to zoom.
              </Typography.Text>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
