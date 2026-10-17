"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Popconfirm,
  Empty,
  Tooltip,
  Select,
  Input,
  Modal,
} from "antd";
import {
  PlusOutlined,
  SwapOutlined,
  DeleteOutlined,
  TranslationOutlined,
  SoundOutlined,
  CopyOutlined,
  AudioOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
  BookOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { translationApi } from "@/lib/api";
import { useTheme } from "@/components/providers/AntdProvider";
import type { Translation } from "@/types";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

function extractApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  const msg = data?.message;
  return Array.isArray(msg) ? msg.join(", ") : msg || fallback;
}

const LANGS = [
  { value: "en", label: "English (UK)", country: "🇬🇧" },
  { value: "en-US", label: "English (US)", country: "🇺🇸" },
  { value: "vi", label: "Vietnamese", country: "🇻🇳" },
  { value: "ja", label: "Japanese", country: "🇯🇵" },
  { value: "ko", label: "Korean", country: "🇰🇷" },
  { value: "zh-CN", label: "Chinese (Mandarin) Simplified 普通话简体", country: "🇨🇳" },
  // Traditional Chinese is a script, not a Mandarin variety — it spans both
  // Taiwan Mandarin and Taiwanese Hokkien, so no "Mandarin" claim here.
  { value: "zh-TW", label: "Chinese (Taiwan) Traditional 中文繁體", country: "🇹🇼" },
  { value: "fr", label: "French", country: "🇫🇷" },
  { value: "de", label: "German", country: "🇩🇪" },
  { value: "es", label: "Spanish", country: "🇪🇸" },
  { value: "pt", label: "Portuguese", country: "🇵🇹" },
  { value: "ru", label: "Russian", country: "🇷🇺" },
  { value: "it", label: "Italian", country: "🇮🇹" },
  { value: "th", label: "Thai", country: "🇹🇭" },
  { value: "id", label: "Indonesian", country: "🇮🇩" },
  { value: "ar", label: "Arabic", country: "🇸🇦" },
  { value: "hi", label: "Hindi", country: "🇮🇳" },
  { value: "nl", label: "Dutch", country: "🇳🇱" },
  { value: "pl", label: "Polish", country: "🇵🇱" },
  { value: "tr", label: "Turkish", country: "🇹🇷" },
  { value: "uk", label: "Ukrainian", country: "🇺🇦" },
  { value: "sv", label: "Swedish", country: "🇸🇪" },
  { value: "no", label: "Norwegian", country: "🇳🇴" },
  { value: "da", label: "Danish", country: "🇩🇰" },
  { value: "fi", label: "Finnish", country: "🇫🇮" },
  { value: "ro", label: "Romanian", country: "🇷🇴" },
  { value: "hu", label: "Hungarian", country: "🇭🇺" },
  { value: "cs", label: "Czech", country: "🇨🇿" },
  { value: "el", label: "Greek", country: "🇬🇷" },
  { value: "fil", label: "Filipino", country: "🇵🇭" },
  { value: "ms", label: "Malay", country: "🇲🇾" },
  { value: "bn", label: "Bengali", country: "🇧🇩" },
  { value: "ur", label: "Urdu", country: "🇵🇰" },
  { value: "fa", label: "Persian", country: "🇮🇷" },
  { value: "he", label: "Hebrew", country: "🇮🇱" },
];

const speechLangMap: Record<string, string> = {
  en: "en-GB",
  "en-US": "en-US",
  vi: "vi-VN",
  ja: "ja-JP",
  ko: "ko-KR",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  ru: "ru-RU",
  it: "it-IT",
  th: "th-TH",
  id: "id-ID",
  ar: "ar-SA",
  hi: "hi-IN",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
  uk: "uk-UA",
  sv: "sv-SE",
  no: "nb-NO",
  da: "da-DK",
  fi: "fi-FI",
  ro: "ro-RO",
  hu: "hu-HU",
  cs: "cs-CZ",
  el: "el-GR",
  fil: "fil-PH",
  ms: "ms-MY",
  bn: "bn-BD",
  ur: "ur-PK",
  fa: "fa-IR",
  he: "he-IL",
};

interface SentenceRow {
  id: string;
  input: string;
  output: string;
  /** Pronunciation guide from the server (pinyin / romaji / respelling). */
  romanization?: string | null;
  translating: boolean;
}

interface LanguageBox {
  boxId: string;
  inputLang: string;
  outputLang: string;
  sentences: SentenceRow[];
}

const LEGACY_STORAGE_KEY = "fb.learningBoxes.v1";

let fallbackIdCounter = 0;
const nextFallbackId = (boxId: string) => `${boxId}-${++fallbackIdCounter}`;

const pairKey = (a: string, b: string) => `${a}->${b}`;

let transientBoxCounter = 0;
const defaultBox = (): LanguageBox => ({
  boxId: `box-${++transientBoxCounter}-${Date.now().toString(36)}`,
  inputLang: "vi",
  outputLang: "en",
  sentences: [],
});

const buildBoxesFromServer = (rows: Translation[]): LanguageBox[] => {
  const byPair = new Map<string, Translation[]>();
  for (const r of rows) {
    const k = pairKey(r.sourceLang, r.targetLang);
    const group = byPair.get(k) ?? [];
    group.push(r);
    byPair.set(k, group);
  }
  return Array.from(byPair.values())
    .sort(
      (a, b) =>
        Math.max(...b.map((r) => Number(new Date(r.createdAt)))) -
        Math.max(...a.map((r) => Number(new Date(r.createdAt))))
    )
    .map((group) => ({
      boxId: pairKey(group[0].sourceLang, group[0].targetLang),
      inputLang: group[0].sourceLang,
      outputLang: group[0].targetLang,
      sentences: group.map((r) => ({
        id: r.id,
        input: r.sourceText,
        output: r.translatedText,
        romanization: r.romanization ?? null,
        translating: false,
      })),
    }));
};

const langOptions = LANGS.map((l) => ({
  value: l.value,
  label: `${l.country} ${l.label}`,
}));

const getLangLabel = (code: string) => LANGS.find((l) => l.value === code)?.label || code;
const getLangMeta = (code: string) => {
  const l = LANGS.find((x) => x.value === code);
  return l ? l : { value: code, label: code, country: "" };
};

export default function TranslationPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const [boxes, setBoxes] = useState<LanguageBox[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [pendingInputs, setPendingInputs] = useState<Record<string, string>>({});
  const [addingBoxes, setAddingBoxes] = useState<Record<string, boolean>>({});
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [hoverBoxId, setHoverBoxId] = useState<string | null>(null);

  const [histories, setHistories] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    sourceText: string;
    translatedText: string;
  } | null>(null);
  const [editTexts, setEditTexts] = useState({ sourceText: "", translatedText: "" });

  const inputRefs = useRef<Record<string, { focus: () => void } | null>>({});

  // Boxes are server-derived only (buildBoxesFromServer). We deliberately do NOT restore them
  // from localStorage at mount — doing so caused a "cache first, then real data" flash
  // (boxes appeared, then disappeared ~1s later when the server response replaced them).
  // Here we just purge the legacy shared-box keys once.
  useEffect(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k === LEGACY_STORAGE_KEY || k.startsWith(`${LEGACY_STORAGE_KEY}.`)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // storage unavailable — ignore
    }
  }, []);

  // Load history (management table) + Learning Boxes from backend.
  useEffect(() => {
    (async () => {
      const ok = await loadHistories();
      if (!ok) messageApi.error("Failed to load translation history");
      setLoading(false);
      setHydrated(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Box management ───
  const addBox = () => {
    setBoxes((prev) => [...prev, defaultBox()]);
  };

  const removeBox = async (boxId: string) => {
    const target = boxes.find((b) => b.boxId === boxId);
    const sentenceIds = (target?.sentences ?? [])
      .map((s) => s.id)
      .filter((id) => !id.startsWith(boxId));
    setBoxes((prev) => prev.filter((b) => b.boxId !== boxId));
    if (activeBoxId === boxId) setActiveBoxId(null);
    setPendingInputs((prev) => {
      const next = { ...prev };
      delete next[boxId];
      return next;
    });
    if (sentenceIds.length) {
      try {
        await translationApi.bulkDelete(sentenceIds);
        messageApi.success(`Deleted ${sentenceIds.length} sentence(s)`);
      } catch (err: unknown) {
        messageApi.error(extractApiError(err, "Failed to delete this box's sentences"));
      }
      // The sentences were rows in Manage Input / Output, so that table has to be
      // refreshed too — otherwise the deleted rows stay on screen until a reload.
      loadHistories();
    }
  };

  const patchBox = (boxId: string, patch: Partial<LanguageBox>) => {
    setBoxes((prev) => prev.map((b) => (b.boxId === boxId ? { ...b, ...patch } : b)));
  };

  const swapPair = (boxId: string) => {
    setBoxes((prev) =>
      prev.map((b) =>
        b.boxId === boxId
          ? { ...b, inputLang: b.outputLang, outputLang: b.inputLang }
          : b
      )
    );
  };

  // ─── Sentence management inside a box ───
  const toggleAdding = (boxId: string) => {
    setAddingBoxes((prev) => {
      const next = { ...prev, [boxId]: !prev[boxId] };
      return next;
    });
    requestAnimationFrame(() => {
      inputRefs.current[boxId]?.focus();
    });
  };

  const setPending = (boxId: string, value: string) => {
    setPendingInputs((prev) => ({ ...prev, [boxId]: value }));
  };

  const handleTranslateAndAdd = async (boxId: string) => {
    const box = boxes.find((b) => b.boxId === boxId);
    if (!box) return;
    const text = (pendingInputs[boxId] || "").trim();
    if (!text) {
      messageApi.warning("Type a sentence first");
      return;
    }
    if (box.inputLang === box.outputLang) {
      messageApi.warning("Input and output languages must be different");
      return;
    }

    try {
      const res = await translationApi.translate({
        sourceText: text,
        sourceLang: box.inputLang,
        targetLang: box.outputLang,
      });
      const data = res.data?.data;
      const row: SentenceRow = {
        id: data?.id || nextFallbackId(boxId),
        input: text,
        output: data?.translatedText || "",
        translating: false,
      };
      setBoxes((prev) =>
        prev.map((b) =>
          b.boxId === boxId ? { ...b, sentences: [...b.sentences, row] } : b
        )
      );
      setPendingInputs((prev) => ({ ...prev, [boxId]: "" }));
      loadHistories();
      requestAnimationFrame(() => {
        inputRefs.current[boxId]?.focus();
      });
    } catch (err: unknown) {
      messageApi.error(extractApiError(err, "Failed to translate sentence"));
    }
  };

  const removeSentence = async (boxId: string, sentenceId: string) => {
    setBoxes((prev) =>
      prev.map((b) =>
        b.boxId === boxId
          ? { ...b, sentences: b.sentences.filter((s) => s.id !== sentenceId) }
          : b
      )
    );
    try {
      await translationApi.remove(sentenceId);
      loadHistories();
    } catch {
      // backend record may already be gone — ignore
    }
  };

  const loadHistories = async (): Promise<boolean> => {
    try {
      const res = await translationApi.myTranslations();
      const rows = res.data?.data || [];
      setHistories(rows);
      setBoxes(buildBoxesFromServer(rows));
      return true;
    } catch {
      return false;
    }
  };

  // ─── TTS ───
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingKeyRef = useRef<string | null>(null);
  const ttsSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isCurrent = (key: string) => speakingKeyRef.current === key;

  const stopSpeaking = () => {
    ttsSeqRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speakingKeyRef.current) {
      speakingKeyRef.current = null;
      setSpeakingKey(null);
    }
  };

  const browserFallback = (text: string, langCode: string, key: string) => {
    if (!isCurrent(key)) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      stopSpeaking();
      messageApi.warning("Text-to-speech is not supported on this browser");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceLang = speechLangMap[langCode] || langCode;
    const available = window.speechSynthesis.getVoices().find((v) =>
      v.lang.toLowerCase().startsWith(voiceLang.toLowerCase())
    );
    if (available) utterance.voice = available;
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.onend = () => {
      if (isCurrent(key)) stopSpeaking();
    };
    utterance.onerror = () => {
      if (isCurrent(key)) stopSpeaking();
    };
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string, langCode: string, key: string) => {
    if (!text) return;
    // Toggle: clicking the same speaker again stops it.
    if (isCurrent(key)) {
      stopSpeaking();
      return;
    }

    // Stop whatever is currently playing before starting fresh.
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    speakingKeyRef.current = key;
    setSpeakingKey(key);
    const seq = ++ttsSeqRef.current;

    try {
      const res = await translationApi.tts(text, langCode);
      // Ignore stale responses (a newer click superseded this one).
      if (seq !== ttsSeqRef.current || !isCurrent(key)) return;

      const data = res.data?.data;
      const audio = data?.audio;
      if (!audio) throw new Error("No audio received");

      const mimeType = data?.mimeType || "audio/mpeg";
      const audioEl = new Audio(`data:${mimeType};base64,${audio}`);
      audioRef.current = audioEl;

      const finish = () => {
        if (seq === ttsSeqRef.current && isCurrent(key)) {
          audioRef.current = null;
          stopSpeaking();
        }
      };
      audioEl.onended = finish;
      audioEl.onerror = () => {
        finish();
        browserFallback(text, langCode, key);
      };

      try {
        await audioEl.play();
      } catch {
        finish();
        browserFallback(text, langCode, key);
      }
    } catch {
      if (!isCurrent(key) || seq !== ttsSeqRef.current) return;
      stopSpeaking();
      browserFallback(text, langCode, key);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success("Copied to clipboard");
  };

  const openEdit = (id: string, sourceText: string, translatedText: string) => {
    setEditTexts({ sourceText, translatedText });
    setEditTarget({ id, sourceText, translatedText });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const sourceText = editTexts.sourceText.trim();
    const translatedText = editTexts.translatedText.trim();
    const serverIdSet = new Set(histories.map((h) => h.id));

    // Update the box sentence immediately (local).
    setBoxes((prev) =>
      prev.map((b) => ({
        ...b,
        sentences: b.sentences.map((s) =>
          s.id === editTarget.id
            ? { ...s, input: sourceText, output: translatedText }
            : s
        ),
      }))
    );

    // Persist to the backend only if this is a real server record.
    if (serverIdSet.has(editTarget.id)) {
      try {
        await translationApi.update({ id: editTarget.id, sourceText, translatedText });
        loadHistories();
      } catch (err: unknown) {
        messageApi.error(extractApiError(err, "Failed to update translation"));
      }
    }
    setEditTarget(null);
  };

  // ─── Management table (history) ───
  // Removes matching sentences from the language boxes (they share the translation id).
  const removeFromBoxes = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setBoxes((prev) =>
      prev.map((b) => ({
        ...b,
        sentences: b.sentences.filter((s) => !idSet.has(s.id)),
      }))
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await translationApi.remove(id);
      messageApi.success("Translation deleted");
      removeFromBoxes([id]);
      loadHistories();
    } catch (err: unknown) {
      messageApi.error(extractApiError(err, "Failed to delete"));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) return;
    try {
      const ids = selectedRowKeys.map((k) => String(k));
      await translationApi.bulkDelete(ids);
      messageApi.success(`Deleted ${ids.length} translation(s)`);
      removeFromBoxes(ids);
      setSelectedRowKeys([]);
      loadHistories();
    } catch (err: unknown) {
      messageApi.error(extractApiError(err, "Failed to delete selected"));
    }
  };

  const columns: ColumnsType<Translation> = [
    {
      title: "Input",
      key: "source",
      render: (_: unknown, record: Translation) => (
        <div>
          <Tag color="purple" style={{ marginBottom: 4 }}>
            {getLangLabel(record.sourceLang)}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 13, display: "block" }}>
            {record.sourceText}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Output",
      key: "target",
      render: (_: unknown, record: Translation) => (
        <div>
          <Tag color="blue" style={{ marginBottom: 4 }}>
            {getLangLabel(record.targetLang)}
          </Tag>
          <Typography.Text style={{ fontSize: 13, display: "block" }}>
            {record.translatedText}
          </Typography.Text>
          {/* Pronunciation guide, when one was produced for the target language.
              Rows saved before romanization existed simply have none. */}
          {record.romanization && (
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, display: "block", fontStyle: "italic" }}
            >
              {record.romanization}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Created",
      key: "createdAt",
      width: 200,
      render: (_: unknown, record: Translation) => (
        <div>
          <Typography.Text style={{ fontSize: 13, display: "block" }}>
            {record.user?.fullname || record.user?.email || "—"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {record.user?.fullname ? record.user.email || "" : ""}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {new Date(record.createdAt).toLocaleString()}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: unknown, record: Translation) => (
        <Space size={4}>
          <Tooltip title="Speak output">
            <Button
              type="text"
              size="small"
              icon={speakingKey === `t-${record.id}` ? <AudioOutlined /> : <SoundOutlined />}
              onClick={() => speak(record.translatedText, record.targetLang, `t-${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Speak input">
            <Button
              type="text"
              size="small"
              icon={speakingKey === `s-${record.id}` ? <AudioOutlined /> : <SoundOutlined />}
              onClick={() => speak(record.sourceText, record.sourceLang, `s-${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Copy output">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record.translatedText)}
            />
          </Tooltip>
          <Tooltip title="Edit translation">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record.id, record.sourceText, record.translatedText)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this translation?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeBox = boxes.find((b) => b.boxId === activeBoxId) || null;
  const cardBg = isDark ? "#1e1e2e" : "#ffffff";
  const boxBg = isDark ? "#14141f" : "#fafafa";

  return (
    <>
      {contextHolder}
      <div style={{ maxWidth: 1680, width: "100%", margin: "0 auto" }}>
        {/* ─── Header ─── */}
        <Card bordered={false} style={{ borderRadius: 16, background: cardBg, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "8px 0 16px" }}>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                <BookOutlined style={{ marginRight: 8, color: "#667eea" }} />
                My Learning Boxes
              </Typography.Title>
              <Typography.Text type="secondary">
                One box per language pair. Click a box to open it and add sentences.
              </Typography.Text>
            </div>
            <Space wrap>
              <Button
                icon={<AudioOutlined />}
                onClick={() => router.push("/translation/realtime")}
                style={{ borderRadius: 10 }}
              >
                Realtime
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addBox}
                style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none" }}
              >
                Add a language box
              </Button>
            </Space>
          </div>

          {/* ─── Compact language-pair cards ─── */}
          {!hydrated ? null : boxes.length === 0 ? (
            <Empty description="No language boxes yet — create one to start learning" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(212px, 1fr))",
                gap: 12,
              }}
            >
              {boxes.map((box) => {
                const inMeta = getLangMeta(box.inputLang);
                const outMeta = getLangMeta(box.outputLang);
                return (
                  <div
                    key={box.boxId}
                    onClick={() => setActiveBoxId(box.boxId)}
                    onMouseEnter={() => setHoverBoxId(box.boxId)}
                    onMouseLeave={() => setHoverBoxId(null)}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(102,126,234,0.35)",
                      background: hoverBoxId === box.boxId ? (isDark ? "#1a1a2e" : "#f4f6ff") : boxBg,
                      padding: "14px 16px",
                      cursor: "pointer",
                      transition: "transform 0.15s ease, border-color 0.15s ease, background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
                        <div>
                          <span style={{ marginRight: 6 }}>{inMeta.country}</span>
                          {inMeta.label}
                        </div>
                        <div
                          style={{
                            fontWeight: 400,
                            fontSize: 13,
                            color: "rgba(136,146,176,0.9)",
                            margin: "4px 0",
                          }}
                        >
                          <ArrowRightOutlined />
                        </div>
                        <div>
                          <span style={{ marginRight: 6 }}>{outMeta.country}</span>
                          {outMeta.label}
                        </div>
                      </div>
                      <Popconfirm
                        title="Delete this language box and its sentences?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          removeBox(box.boxId);
                        }}
                        onCancel={(e) => {
                          e?.stopPropagation();
                        }}
                        okText="Delete"
                        okType="danger"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 12,
                      }}
                    >
                      <Tag color="purple" style={{ margin: 0 }}>
                        {box.sentences.length} sentence{box.sentences.length === 1 ? "" : "s"}
                      </Tag>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Open <ArrowRightOutlined style={{ fontSize: 11 }} />
                      </Typography.Text>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ─── Language pair modal ─── */}
        <Modal
          open={!!activeBox}
          onCancel={() => setActiveBoxId(null)}
          width={820}
          destroyOnClose
          footer={
            activeBox ? (
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Popconfirm
                  title="Delete this language box and its sentences?"
                  onConfirm={() => removeBox(activeBox.boxId)}
                  okText="Delete"
                  okType="danger"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Delete box
                  </Button>
                </Popconfirm>
                <Button type="primary" onClick={() => setActiveBoxId(null)}>
                  Close
                </Button>
              </Space>
            ) : null
          }
          title={
            activeBox ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Select
                  size="small"
                  value={activeBox.inputLang}
                  onChange={(v) => patchBox(activeBox.boxId, { inputLang: v })}
                  options={langOptions}
                  style={{ width: 170 }}
                  popupMatchSelectWidth={false}
                />
                <ArrowRightOutlined style={{ color: "#8892b0" }} />
                <Select
                  size="small"
                  value={activeBox.outputLang}
                  onChange={(v) => patchBox(activeBox.boxId, { outputLang: v })}
                  options={langOptions}
                  style={{ width: 170 }}
                  popupMatchSelectWidth={false}
                />
                <Tooltip title="Swap input / output">
                  <Button
                    type="text"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => swapPair(activeBox.boxId)}
                  />
                </Tooltip>
                <Tag color="purple" style={{ marginLeft: 4 }}>
                  {activeBox.sentences.length} sentence{activeBox.sentences.length === 1 ? "" : "s"}
                </Tag>
              </div>
            ) : null
          }
        >
          {activeBox && (
            <div>
              {/* Sentence list (scrollable) */}
              <div style={{ maxHeight: "56vh", overflowY: "auto", paddingRight: 4 }}>
                {activeBox.sentences.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={`No sentences in ${getLangLabel(activeBox.inputLang)} → ${getLangLabel(
                      activeBox.outputLang
                    )} yet`}
                    style={{ margin: "24px 0" }}
                  />
                ) : (
                  activeBox.sentences.map((row, idx) => (
                    <div
                      key={row.id}
                      style={{
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: isDark ? "#1a1a2e" : "#fff",
                        padding: "10px 12px",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                            <Tag color="purple" style={{ marginRight: 4 }}>
                              {idx + 1}
                            </Tag>
                            {row.input}
                          </Typography.Text>
                          <Typography.Text style={{ fontSize: 14, display: "block", marginTop: 4 }}>
                            {row.output || "\u00a0"}
                          </Typography.Text>
                          {/* Pronunciation guide (pinyin for Chinese, romaji for
                              Japanese, respelling for English). Absent for
                              other languages, so nothing is drawn. */}
                          {row.romanization && (
                            <Typography.Text
                              type="secondary"
                              style={{ fontSize: 12.5, display: "block", fontStyle: "italic", marginTop: 2 }}
                            >
                              {row.romanization}
                            </Typography.Text>
                          )}
                        </div>
                        <Space size={4}>
                          <Tooltip title="Speak output">
                            <Button
                              type="text"
                              size="small"
                              icon={speakingKey === `b-${row.id}` ? <AudioOutlined /> : <SoundOutlined />}
                              onClick={() => speak(row.output, activeBox.outputLang, `b-${row.id}`)}
                            />
                          </Tooltip>
                          <Tooltip title="Speak input">
                            <Button
                              type="text"
                              size="small"
                              icon={speakingKey === `s-${row.id}` ? <AudioOutlined /> : <SoundOutlined />}
                              onClick={() => speak(row.input, activeBox.inputLang, `s-${row.id}`)}
                            />
                          </Tooltip>
                          <Tooltip title="Copy output">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(row.output)}
                            />
                          </Tooltip>
                          <Tooltip title="Edit sentence">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEdit(row.id, row.input, row.output)}
                            />
                          </Tooltip>
                          <Popconfirm
                            title="Remove this sentence?"
                            onConfirm={() => removeSentence(activeBox.boxId, row.id)}
                            okText="Remove"
                            okType="danger"
                          >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add-new-sentence (always visible at the bottom) */}
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  marginTop: 12,
                  paddingTop: 12,
                }}
              >
                {addingBoxes[activeBox.boxId] ? (
                  <div
                    style={{
                      borderRadius: 12,
                      border: "1px dashed rgba(102,126,234,0.6)",
                      padding: 12,
                      background: isDark ? "#1a1a2e" : "#f0f4ff",
                    }}
                  >
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                      New sentence in {getLangLabel(activeBox.inputLang)}
                    </Typography.Text>
                    <TextArea
                      ref={(el) => {
                        inputRefs.current[activeBox.boxId] = el;
                      }}
                      value={pendingInputs[activeBox.boxId] || ""}
                      onChange={(e) => setPending(activeBox.boxId, e.target.value)}
                      placeholder={`Type a sentence in ${getLangLabel(activeBox.inputLang)}`}
                      autoSize={{ minRows: 2, maxRows: 5 }}
                      maxLength={5000}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleTranslateAndAdd(activeBox.boxId);
                        }
                      }}
                      style={{
                        resize: "none",
                        borderRadius: 10,
                        background: isDark ? "#14141f" : "#fff",
                        color: isDark ? "#fff" : undefined,
                      }}
                    />
                    <Space style={{ marginTop: 10 }}>
                      <Button
                        type="primary"
                        icon={<TranslationOutlined />}
                        onClick={() => handleTranslateAndAdd(activeBox.boxId)}
                        style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none" }}
                      >
                        Translate &amp; Add
                      </Button>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        or press Enter
                      </Typography.Text>
                    </Space>
                  </div>
                ) : (
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => toggleAdding(activeBox.boxId)}
                  >
                    Add a new sentence
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* ─── Edit sentence modal (shared by boxes and history table) ─── */}
        <Modal
          open={!!editTarget}
          onOk={handleSaveEdit}
          onCancel={() => setEditTarget(null)}
          width={560}
          okText="Save"
          cancelText="Cancel"
          title={
            <Space size={8}>
              <EditOutlined style={{ color: "#667eea" }} />
              Edit sentence
            </Space>
          }
          destroyOnClose
        >
          {editTarget && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                  Input
                </Typography.Text>
                <TextArea
                  value={editTexts.sourceText}
                  onChange={(e) => setEditTexts((prev) => ({ ...prev, sourceText: e.target.value }))}
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  maxLength={5000}
                  style={{ resize: "none", borderRadius: 10 }}
                />
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                  Output
                </Typography.Text>
                <TextArea
                  value={editTexts.translatedText}
                  onChange={(e) => setEditTexts((prev) => ({ ...prev, translatedText: e.target.value }))}
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  maxLength={5000}
                  style={{ resize: "none", borderRadius: 10 }}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* ─── Management table ─── */}
        <Card bordered={false} style={{ borderRadius: 16, background: cardBg }} id="history">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                <HistoryOutlined style={{ marginRight: 8, color: "#667eea" }} />
                Manage Input / Output
              </Typography.Title>
              <Typography.Text type="secondary">
                Every sentence you add is collected here so you can check and review.
              </Typography.Text>
            </div>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Delete ${selectedRowKeys.length} selected translation(s)?`}
                onConfirm={handleBulkDelete}
                okText="Delete"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
          </div>

          <Table
            columns={columns}
            dataSource={histories}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50", "100"],
              onChange: (page, size) => setPagination({ current: page, pageSize: size }),
            }}
            locale={{ emptyText: <Empty description="No sentences yet — add some above" /> }}
            scroll={{ x: "max-content" }}
            size="middle"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
          />
        </Card>
      </div>
    </>
  );
}