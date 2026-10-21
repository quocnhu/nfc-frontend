"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Button,
  Upload,
  Image,
  Space,
  Tag,
  Popconfirm,
  message,
  Spin,
  Empty,
  Row,
  Col,
  Tooltip,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PictureOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  ReloadOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { homepageApi, type HomepageData } from "@/lib/api";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function HomepageAdminPage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await homepageApi.getAdmin();
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch {
      message.error("Failed to load homepage data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (folder: string, file: File) => {
    setUploading(folder);
    try {
      const res = await homepageApi.upload(folder, file);
      if (res.data?.success) {
        message.success("Image uploaded successfully");
        await fetchData();
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleUploadMultiple = async (folder: string, files: File[]) => {
    if (!files || files.length === 0) return;
    setUploading(folder);
    let successCount = 0;
    const errors: string[] = [];

    try {
      const results = await Promise.allSettled(
        files.map((file) => homepageApi.upload(folder, file))
      );
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "fulfilled" && r.value?.data?.success) {
          successCount += 1;
        } else {
          const msg =
            r.status === "rejected"
              ? (r.reason?.response?.data?.message || r.reason?.message || "Upload failed")
              : ("Upload failed");
          errors.push(`${files[i].name}: ${msg}`);
        }
      }

      if (successCount > 0) {
        message.success(
          successCount === files.length
            ? `Uploaded ${successCount} image${successCount > 1 ? "s" : ""}`
            : `Uploaded ${successCount}/${files.length} images`
        );
        await fetchData();
      }
      if (errors.length > 0) {
        message.error(errors.slice(0, 3).join(" | "));
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (folder: string, filename: string) => {
    try {
      const res = await homepageApi.delete(folder, filename);
      if (res.data?.success) {
        message.success("Image deleted");
        await fetchData();
      }
    } catch {
      message.error("Delete failed");
    }
  };

  const handleSetup = async () => {
    try {
      const res = await homepageApi.setup();
      if (res.data?.success) {
        message.success("Homepage folders created");
        await fetchData();
      }
    } catch {
      message.error("Setup failed");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <HomeOutlined style={{ marginRight: 12 }} />
            Homepage Content
          </Title>
          <Text type="secondary">Manage slideshow, tour guide images, and avatar for the public homepage.</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
          <Button type="dashed" onClick={handleSetup}>
            Setup Folders
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <CameraOutlined />
                <span>Avatar</span>
              </Space>
            }
            extra={<Tag color="blue">Synced from Profile</Tag>}
          >
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              {data?.avatar ? (
                <Image
                  src={data.avatar}
                  alt="Homepage Avatar"
                  width={160}
                  height={160}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiMxZTFmMmUiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjcwIiByPSIzMCIgZmlsbD0iIzMzMzA0YSIvPjxwYXRoIGQ9Ik0zMCAxNDBjMC0yNy42IDIyLjQtNTAgNTAtNTBzNTAgMjIuNCA1MCA1MCIgZmlsbD0iIzMzMzA0YSIvPjwvc3ZnPg=="
                />
              ) : (
                <Empty
                  image={<CameraOutlined style={{ fontSize: 48, color: "#666" }} />}
                  description="No avatar set"
                />
              )}
              <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
                Avatar is synced from your profile. Update it in the Profile page.
              </Paragraph>
              <Button
                type="link"
                href="/profile"
                style={{ marginTop: 8 }}
              >
                Go to Profile
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <PictureOutlined />
                <span>Slideshow Photos</span>
                <Tag color="purple">{data?.slideshowpics?.length || 0} images</Tag>
              </Space>
            }
          >
            <Dragger
              multiple
              showUploadList={false}
              beforeUpload={(file, fileList) => {
                const isImage = file.type.startsWith("image/");
                if (!isImage) {
                  message.error(`${file.name}: Only image files are allowed`);
                  return false;
                }
                if (file.size > 10 * 1024 * 1024) {
                  message.error(`${file.name}: File must be smaller than 10MB`);
                  return false;
                }
                // Trigger batch upload when we see the last file in the selection
                const idx = fileList.findIndex((f) => f.uid === file.uid);
                if (idx === fileList.length - 1) {
                  const valid = fileList.filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
                  if (valid.length > 0) {
                    handleUploadMultiple("slideshowpics", valid);
                  } else {
                    message.error("No valid images to upload");
                  }
                }
                return false;
              }}
              disabled={uploading !== null}
              style={{ padding: "12px 0", background: "transparent" }}
            >
              <p className="ant-upload-drag-icon">
                {uploading === "slideshowpics" ? <Spin /> : <InboxOutlined />}
              </p>
              <p className="ant-upload-text">Click or drag images to upload</p>
              <p className="ant-upload-hint">JPEG, PNG. Max 10MB each.</p>
            </Dragger>

            {data?.slideshowpics && data.slideshowpics.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <Image.PreviewGroup>
                  <Row gutter={[12, 12]}>
                    {data.slideshowpics.map((img) => (
                      <Col key={img.name} xs={12} sm={8} md={6}>
                        <div style={{ position: "relative" }}>
                          <Image
                            src={img.url}
                            alt={img.name}
                            width="100%"
                            height={120}
                            style={{ objectFit: "cover", borderRadius: 8 }}
                            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMxZTFmMmUiLz48dGV4dCB4PSIxMDAiIHk9IjYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjE0Ij5ObyBpbWFnZTwvdGV4dD48L3N2Zz4="
                          />
                          <Popconfirm
                            title="Delete this image?"
                            onConfirm={() => handleDelete("slideshowpics", img.name)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Tooltip title="Delete">
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  background: "rgba(0,0,0,0.6)",
                                  borderRadius: "50%",
                                }}
                              />
                            </Tooltip>
                          </Popconfirm>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </div>
            ) : (
              <Empty
                description="No slideshow photos yet"
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                <span>Tour Guide Picture</span>
                <Tag color="gold">{data?.tourguidepic?.length || 0} image</Tag>
              </Space>
            }
          >
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Dragger
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith("image/");
                    if (!isImage) {
                      message.error("Only image files are allowed");
                      return false;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      message.error("File must be smaller than 10MB");
                      return false;
                    }
                    if (data?.tourguidepic && data.tourguidepic.length > 0) {
                      message.warning("Only one tour guide image allowed. Delete the current one first.");
                      return false;
                    }
                    handleUpload("tourguidepic", file);
                    return false;
                  }}
                  disabled={uploading !== null || (data?.tourguidepic?.length || 0) > 0}
                  style={{ padding: "12px 0", background: "transparent" }}
                >
                  <p className="ant-upload-drag-icon">
                    {uploading === "tourguidepic" ? <Spin /> : <InboxOutlined />}
                  </p>
                  <p className="ant-upload-text">Upload tour guide image</p>
                  <p className="ant-upload-hint">JPEG, PNG. Max 10MB. One image only.</p>
                </Dragger>
              </Col>
              <Col xs={24} md={16}>
                {data?.tourguidepic && data.tourguidepic.length > 0 ? (
                  <div style={{ position: "relative" }}>
                    <Image
                      src={data.tourguidepic[0].url}
                      alt="Tour Guide"
                      width="100%"
                      height={240}
                      style={{ objectFit: "cover", borderRadius: 12 }}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiMxZTFmMmUiLz48dGV4dCB4PSIyMDAiIHk9IjEyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NiIgZm9udC1zaXplPSIxNiI+Tm8gaW1hZ2U8L3RleHQ+PC9zdmc+"
                    />
                    <Popconfirm
                      title="Delete tour guide image?"
                      onConfirm={() => handleDelete("tourguidepic", data.tourguidepic![0].name)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                        }}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                ) : (
                  <div
                    style={{
                      height: 240,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 12,
                      border: "1px dashed rgba(255,255,255,0.1)",
                    }}
                  >
                    <Empty description="No tour guide image yet" />
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
