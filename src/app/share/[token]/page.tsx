"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  GlobalOutlined,
  SoundOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import { sharedBoxApi, translationApi } from "@/lib/api";
import type { SharedBoxMeta, SharedSentence } from "@/types";
import { extractApiError } from "@/lib/api-error";
import { useTheme } from "@/components/providers/AntdProvider";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Mirrors the realtime view's compact badge for a language code. */
const SHORT: Record<string, string> = {
  vi: "VI", en: "EN", "zh-CN": "简中", "zh-TW": "繁中",
  hi: "HI", fr: "FR", de: "DE", es: "ES", ja: "JA", ko: "KO",
};
const shortOf = (code: string) => SHORT[code] ?? code.toUpperCase();

/**
 * PublicSharedBoxPage — the visitor's side of a shared learning box.
 *
 * No sign-in, no dashboard, no cookies: the token in the URL is the whole
 * capability. What a visitor can do is exactly read and append, and a guest's
 * sentence is stored against the box rather than the owner's own history, so
 * nothing here can leak into (or be mistaken for) their private learning data.
 *
 * Live updates arrive over the /shared-box socket. Writes go over HTTP rather
 * than the socket so they pass through validation, rate limiting and the
 * translation service in one place.
 */
export default function PublicSharedBoxPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const { isDark } = useTheme();
  // useMessage, not App.useApp: the root layout has no antd <App> wrapper, so the
  // context hook would throw on a guest who never touches the dashboard.
  const [messageApi, contextHolder] = message.useMessage();

  const [box, setBox] = useState<SharedBoxMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [watchers, setWatchers] = useState(0);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const bg = isDark ? "#0f1115" : "#f7f8fa";
  const card = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const line = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const dim = isDark ? "#8b8f98" : "#6b7280";
  const text = isDark ? "#e8eaed" : "#1f2328";

  /** Merge one sentence in, ignoring a broadcast we already applied. */
  const appendSentence = useCallback((sentence: SharedSentence) => {
    setBox((prev) => {
      if (!prev) return prev;
      if (prev.sentences.some((s) => s.id === sentence.id)) return prev;
      return { ...prev, sentences: [...prev.sentences, sentence] };
    });
  }, []);

  // Fetch inline rather than through a useCallback helper: the effect must not
  // call setState synchronously, and the cancelled flag stops a slow response
  // from landing after the token changed or the visitor navigated away.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await sharedBoxApi.readPublic(token);
        if (cancelled) return;
        setBox(res.data?.data ?? null);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(extractApiError(err, "This shared box is not available"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Live sync. Joining is keyed by token, so the owner watching the same box
  // sees every sentence a visitor adds, and vice versa.
  useEffect(() => {
    if (!token) return;
    const socket = io(`${API}/shared-box`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("box:join", { token }));
    socket.on(
      "box:sentence",
      (p: { sentence: SharedSentence }) => {
        if (p?.sentence) appendSentence(p.sentence);
      },
    );
    socket.on("box:presence", (p: { count?: number }) => {
      setWatchers(p?.count ?? 0);
    });

    return () => {
      socket.emit("box:leave", { token });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, appendSentence]);

  // Keep the newest sentence in view — this is a conversation, so the tail
  // moving as someone speaks is the whole feedback loop.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [box?.sentences.length]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await sharedBoxApi.addSentence(token, text);
      setDraft("");
      // The broadcast usually arrives first; this keeps the UI instant when the
      // socket is slow, and appendSentence de-duplicates by id.
      if (res.data?.data) appendSentence(res.data.data);
    } catch (err) {
      messageApi.error(extractApiError(err, "Could not add that sentence"));
    } finally {
      setSending(false);
    }
  };

  const speak = async (sentence: SharedSentence) => {
    if (!box) return;
    const key = sentence.id;
    if (speakingKey) return;
    setSpeakingKey(key);
    try {
      const res = await translationApi.tts(sentence.translatedText, box.outputLang);
      const b64 = res.data?.data?.audio;
      const mime = res.data?.data?.mimeType || "audio/mpeg";
      if (!b64) return;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const audio = new Audio(url);
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
      URL.revokeObjectURL(url);
    } catch {
      messageApi.error("Speech is unavailable right now");
    } finally {
      setSpeakingKey(null);
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh", background: bg }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (loadError || !box) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh", background: bg, padding: 24 }}>
        <Alert
          type="warning"
          showIcon
          message="This box is not available"
          description={
            loadError ??
            "The share link may have been revoked, or the address is incomplete."
          }
        />
      </Flex>
    );
  }

  return (
    <>
      {contextHolder}
    <div style={{ minHeight: "100vh", background: bg, color: text, display: "flex", flexDirection: "column" }}>
      {/* Header: what this box is, and whether anyone else is here. */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${line}`,
          background: card,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Tag color="blue" style={{ margin: 0 }}>
          {shortOf(box.inputLang)} → {shortOf(box.outputLang)}
        </Tag>
        <Typography.Text strong style={{ fontSize: 15 }}>
          Shared learning box
        </Typography.Text>
        <span style={{ color: dim, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <GlobalOutlined />
          {watchers > 1 ? `${watchers} people here` : "shared with you"}
        </span>
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {box.sentences.length === 0 ? (
            <Empty
              description="No sentences yet. Add the first one below."
              style={{ marginTop: 48, color: dim }}
            />
          ) : (
            box.sentences.map((s) => (
              <Card
                key={s.id}
                bordered={false}
                style={{ background: card, border: `1px solid ${line}`, borderRadius: 14 }}
                styles={{ body: { padding: 14 } }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Tag
                    color={s.isOwner ? "geekblue" : "default"}
                    icon={<UserOutlined />}
                    style={{ margin: 0, flexShrink: 0 }}
                  >
                    {s.isOwner ? "Owner" : "Visitor"}
                  </Tag>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Paragraph style={{ margin: 0, color: dim, fontSize: 13 }}>
                      {s.sourceText}
                    </Typography.Paragraph>
                    <Typography.Paragraph style={{ margin: "4px 0 0", fontSize: 15 }}>
                      {s.translatedText}
                    </Typography.Paragraph>
                    {s.romanization && (
                      <Typography.Text style={{ color: dim, fontSize: 12.5, fontStyle: "italic" }}>
                        {s.romanization}
                      </Typography.Text>
                    )}
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={speakingKey === s.id ? <AudioOutlined /> : <SoundOutlined />}
                    disabled={Boolean(speakingKey)}
                    onClick={() => speak(s)}
                    aria-label="Play pronunciation"
                  />
                </div>
              </Card>
            ))
          )}
          <div ref={listEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div
        style={{
          borderTop: `1px solid ${line}`,
          background: card,
          padding: 14,
          position: "sticky",
          bottom: 0,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={submit}
              placeholder={`Type in ${shortOf(box.inputLang)} — it will be translated to ${shortOf(box.outputLang)}`}
              maxLength={5000}
              disabled={sending}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sending}
              onClick={submit}
              disabled={!draft.trim()}
            >
              Add
            </Button>
          </Space.Compact>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
            Shared by link — anyone with the QR can read and add. No account needed.
          </Typography.Text>
        </div>
      </div>
    </div>
    </>
  );
}