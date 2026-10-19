"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button, Modal, Input, Space, Typography, message, Tooltip } from "antd";
import { ShareAltOutlined, CopyOutlined, StopOutlined } from "@ant-design/icons";
import { sharedBoxApi } from "@/lib/api";
import { extractApiError } from "@/lib/api-error";

/**
 * ShareBoxButton — opens one learning box to anonymous visitors.
 *
 * The QR points at /share/{token}, a page that needs no account. What a visitor
 * sees is only what is written into the *shared* box, which starts empty —
 * sharing never publishes the owner's existing Translation history for that
 * language pair.
 */
export default function ShareBoxButton({
  inputLang,
  outputLang,
  label = "Share",
}: {
  inputLang: string;
  outputLang: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [boxId, setBoxId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const url =
    token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  /**
   * Idempotent on the backend: opening a box for a language pair that already
   * has one returns the existing token rather than minting another, so the QR
   * a visitor already scanned keeps working after the owner re-clicks Share.
   */
  const openShare = async () => {
    setOpen(true);
    if (token) return;
    setBusy(true);
    try {
      const res = await sharedBoxApi.create({ inputLang, outputLang });
      const data = res.data?.data;
      setToken(data?.token ?? null);
      setBoxId(data?.id ?? null);
    } catch (err) {
      messageApi.error(extractApiError(err, "Could not create a share link"));
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!boxId) return;
    setRevoking(true);
    try {
      await sharedBoxApi.disable(boxId);
      messageApi.success("Share link revoked. Sentences are kept.");
      setToken(null);
      setBoxId(null);
    } catch (err) {
      messageApi.error(extractApiError(err, "Could not revoke the link"));
    } finally {
      setRevoking(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      messageApi.success("Link copied");
    } catch {
      messageApi.error("Could not copy — copy the link manually.");
    }
  };

  return (
    <>
      {contextHolder}
      <Tooltip title="Let anyone with this link read and add to this box">
        <Button size="small" icon={<ShareAltOutlined />} onClick={openShare}>
          {label}
        </Button>
      </Tooltip>

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0, textAlign: "center" }}>
            Anyone who scans this gets a private view of <strong>this box only</strong>. Your
            existing saved sentences stay private, and their additions are kept
            separately from your own history.
          </Typography.Paragraph>

          {busy ? (
            <Typography.Text type="secondary">Creating link…</Typography.Text>
          ) : url ? (
            <>
              <div
                style={{
                  padding: 14,
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,.08)",
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG value={url} size={176} marginSize={0} />
              </div>
              <Input value={url} readOnly size="small" style={{ width: "100%" }} />
              <Space wrap>
                <Button size="small" icon={<CopyOutlined />} onClick={copy}>
                  Copy link
                </Button>
                <Button size="small" onClick={() => window.open(url, "_blank")}>
                  Open guest view
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  loading={revoking}
                  onClick={revoke}
                >
                  Revoke
                </Button>
              </Space>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}