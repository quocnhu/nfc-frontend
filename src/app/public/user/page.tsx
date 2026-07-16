"use client";

import { useState } from "react";
import { Card, Input, Button, Typography, List, Space, Spin, Alert } from "antd";
import { LinkOutlined, SearchOutlined } from "@ant-design/icons";
import { sharingApi } from "@/lib/api";
import type { SharingContent } from "@/types";

interface PublicProfile {
  user: { id: string; fullname: string; email: string };
  items: SharingContent[];
}

export default function PublicUserPage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await sharingApi.publicByUser(userId.trim());
      if (res.data?.data) {
        setProfile(res.data.data);
      } else {
        setError("User not found");
      }
    } catch {
      setError("User not found or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: 24 }}>
      <Typography.Title level={2} style={{ textAlign: "center" }}>
        Public User Profile
      </Typography.Title>
      <Typography.Paragraph style={{ textAlign: "center", color: "#999" }}>
        Enter a user UUID to view their sharing content
      </Typography.Paragraph>

      <Space.Compact style={{ width: "100%", marginBottom: 24 }}>
        <Input
          placeholder="Enter user UUID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
        >
          Search
        </Button>
      </Space.Compact>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      {profile && (
        <Card title={profile.user.fullname}>
          <Typography.Paragraph type="secondary">{profile.user.email}</Typography.Paragraph>
          <List
            dataSource={profile.items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.itemName}
                  description={
                    <Typography.Link href={item.url} target="_blank">
                      <LinkOutlined /> {item.url}
                    </Typography.Link>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
