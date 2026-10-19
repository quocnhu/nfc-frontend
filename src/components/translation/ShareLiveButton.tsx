"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button, Modal, Input, Space, Typography, message } from "antd";
import { ShareAltOutlined, CopyOutlined, SaveOutlined } from "@ant-design/icons";
import { qrApi } from "@/lib/api";

/**
 * ShareLiveButton — hands the public translator to strangers.
 *
 * Anyone with the link (or a scan of the QR) lands on /live and gets their own
 * private translation session. No sign-in, no account, nothing shared between
 * visitors — the socket keys state by connection, so each person sees only
 * their own conversation.
 *
 * The URL is built from window.location.origin rather than a stored value so a
 * scan works on whatever host it was shared from — Vercel preview, local
 * machine or production — without reconfiguring anything.
 */
export default function ShareLiveButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const liveUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/live`;
  }, []);

  const [saving, setSaving] = useState(false);

  const saveToLibrary = async () => {
    setSaving(true);
    try {
      await qrApi.create({ name: "Live translator", url: liveUrl });
      messageApi.success("Saved to your QR codes");
    } catch {
      messageApi.error("Could not save. You can still copy the link above.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      messageApi.success("Link copied");
    } catch {
      messageApi.error("Could not copy — select the link and copy it manually.");
    }
  };

  return (
    <>
      {contextHolder}
      <Button
        icon={<ShareAltOutlined />}
        onClick={() => setOpen(true)}
        size={compact ? "small" : "middle"}
      >
        {compact ? "Share" : "Share public translator"}
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title="Share the live translator"
        width={420}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
            Anyone who scans this gets their own private translator. No account
            needed, and you never see their conversation.
          </Typography.Paragraph>

          {liveUrl ? (
            <div
              style={{
                padding: 14,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.08)",
                lineHeight: 0,
              }}
            >
              <QRCodeSVG value={liveUrl} size={184} marginSize={0} />
            </div>
          ) : null}

          <Input value={liveUrl} readOnly size="small" style={{ width: "100%" }} />

          <Space wrap>
            <Button icon={<CopyOutlined />} onClick={copyLink}>
              Copy link
            </Button>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={saveToLibrary}
            >
              Save to QR library
            </Button>
            <Button type="primary" onClick={() => window.open(liveUrl, "_blank")}>
              Open
            </Button>
          </Space>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Open this page in a private window to check the guest view.
          </Typography.Text>
        </div>
      </Modal>
    </>
  );
}