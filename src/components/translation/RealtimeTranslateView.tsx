"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Select, Empty, Tooltip, message } from "antd";
import {
  AudioOutlined,
  DeleteOutlined,
  RobotOutlined,
  TranslationOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  DisconnectOutlined,
  ExclamationCircleFilled,
  ThunderboltFilled,
} from "@ant-design/icons";
import { useLiveTranslate, loadLangs, saveLangs } from "@/hooks/useLiveTranslate";
import { useTheme } from "@/components/providers/AntdProvider";

// Every dropdown is labelled in English first, with the endonym second, so the
// language is unambiguous without needing to read the script. zh-CN is named
// Mandarin because it genuinely is Standard Mandarin (Putonghua). zh-TW is
// labelled "Chinese (Taiwan)": it is Traditional Chinese *script*, which covers
// both Taiwan Mandarin and Taiwanese Hokkien — "Taiwanese" would wrongly imply
// a language variety that does not exist.
const LANGS = [
  { value: "vi", label: "🇻🇳 Vietnamese · Tiếng Việt" },
  { value: "en", label: "🇺🇸 English" },
  { value: "zh-CN", label: "🇨🇳 Chinese (Mandarin) · 普通话 简体" },
  { value: "zh-TW", label: "🇹🇼 Chinese (Taiwan) · 中文 繁體" },
  { value: "hi", label: "🇮🇳 Hindi · हिन्दी" },
  { value: "fr", label: "🇫🇷 French · Français" },
  { value: "de", label: "🇩🇪 German · Deutsch" },
  { value: "es", label: "🇪🇸 Spanish · Español" },
  { value: "ja", label: "🇯🇵 Japanese · 日本語" },
  { value: "ko", label: "🇰🇷 Korean · 한국어" },
];

/** Default output languages: Vietnamese, Chinese, Spanish. */
const DEFAULT_TARGETS = ["vi", "zh-CN", "es"];

const SHORT: Record<string, string> = {
  vi: "VI",
  en: "EN",
  "zh-CN": "简中",
  "zh-TW": "繁中",
  hi: "HI",
  fr: "FR",
  de: "DE",
  es: "ES",
  ja: "JA",
  ko: "KO",
};

const labelOf = (code: string) => LANGS.find((l) => l.value === code)?.label ?? code;
const shortOf = (code: string) => SHORT[code] ?? code.toUpperCase();

/** How many language chips stay visible before the rest collapse behind "+N". */
const MAX_CHIPS = 4;

/** Sentinel for "work it out yourself" — stripped before the hint reaches Gemini. */
const AUTO = "auto";

/**
 * Long sentences get a wider measure and a slightly smaller cap so the whole line
 * stays readable without becoming a wall of text; short ones can afford to be big.
 */
const sentenceSize = (len: number): string =>
  len > 220 ? "clamp(16px, 1.35vw, 20px)"
  : len > 110 ? "clamp(18px, 1.7vw, 24px)"
  : "clamp(21px, 2.3vw, 30px)";

/** Translations track the source sentence, one step smaller so hierarchy holds. */
const translationSize = (len: number): string =>
  len > 220 ? "clamp(13px, 1.05vw, 15px)"
  : len > 110 ? "clamp(14px, 1.2vw, 16.5px)"
  : "clamp(15px, 1.35vw, 18px)";

const SOURCE_OPTIONS = [
  { value: AUTO, label: "Auto-detect" },
  ...LANGS.map((l) => ({ value: l.value, label: l.label })),
];

/** Gemini is told to keep **bold** markers; turn them into real emphasis. */
const renderEmphasis = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <b
        key={i}
        style={{
          fontWeight: 700,
          background: "linear-gradient(transparent 62%, var(--fb-accent-soft) 0)",
        }}
      >
        {part.slice(2, -2)}
      </b>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

/**
 * Reveal — types a finished utterance out word by word.
 *
 * The transcript is already final when it arrives, but filling it in live is what
 * makes a card feel like a live turn rather than a text dump, and it holds the
 * eye long enough for the translations to land behind it.
 */
function Reveal({ text, onDone }: { text: string; onDone: () => void }) {
  const words = useMemo(() => text.split(" "), [text]);
  const [shown, setShown] = useState(0);
  // onDone is an inline closure at the call site, so it is a new function on
  // every render. Depending on it would reset this timer on each render — and
  // the parent renders constantly (mic ticks, partials) — so the card would
  // type one word at best and sit on "Transcribing" forever. Read it via ref.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (shown >= words.length) {
      doneRef.current();
      return;
    }
    // Background tabs throttle timers to ~1/min, which would stall cards on
    // "Transcribing" forever while YouTube plays next door — reveal at once.
    if (typeof document !== "undefined" && document.hidden) {
      setShown(words.length);
      return;
    }
    const id = setTimeout(() => setShown((n) => n + 1), 25);
    return () => clearTimeout(id);
  }, [shown, words.length]);

  return <>{renderEmphasis(words.slice(0, shown).join(" "))}</>;
}

export default function RealtimeTranslateModal({
  onClose,
  headerExtra,
}: {
  onClose: () => void;
  /**
   * Rendered in the header strip, left of the close button. Lets the owning
   * dashboard inject controls without the guest-facing /live route showing
   * them. Injected here rather than positioned over the view, which is a
   * fixed full-screen layer at a much higher z-index.
   */
  headerExtra?: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const live = useLiveTranslate();

  const [sourceLangs, setSourceLangs] = useState<string[]>(() => loadLangs("fb.rt.source", [AUTO]));
  useEffect(() => {
    saveLangs("fb.rt.source", sourceLangs);
  }, [sourceLangs]);

  // "auto" is a UI-only sentinel: an empty hint list tells Gemini to detect the
  // language itself, which is what mixed-language conversations need.
  const sourceHints = useMemo(() => sourceLangs.filter((l) => l !== AUTO), [sourceLangs]);
  const sourceLabel =
    sourceLangs.includes(AUTO) && sourceHints.length === 0
      ? "auto"
      : sourceHints.map(labelOf).join(", ") || "auto";
  // Badge text for a turn's input language: explicit picks are stated outright,
  // auto mode shows whatever was detected for that specific turn.
  const inputBadgeOf = (detectedSource?: string | null) =>
    sourceHints.length > 0
      ? sourceHints.map(labelOf).join(", ")
      : detectedSource
        ? labelOf(detectedSource)
        : null;
  const [targetLangs, setTargetLangs] = useState<string[]>(() =>
    loadLangs("fb.rt.targets", [...DEFAULT_TARGETS]),
  );
  useEffect(() => {
    saveLangs("fb.rt.targets", targetLangs);
  }, [targetLangs]);
  const [amp, setAmp] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [demo, setDemo] = useState(false);
  const [langsOpen, setLangsOpen] = useState(false);

  const tokens = useMemo(
    () => ({
      bg: isDark ? "#0F1115" : "#F9FAFB",
      surface: isDark ? "#171A20" : "#fff",
      ink: isDark ? "#F3F4F6" : "#111827",
      muted: isDark ? "#9CA3AF" : "#6B7280",
      line: isDark ? "#262A33" : "#E5E7EB",
      accentSoft: isDark ? "#3A1E1A" : "#FEECE8",
    }),
    [isDark],
  );

  // Mic level drives the ring animation. Web Speech gives no level, so we animate
  // on the same clock while listening and fall back to a gentle idle pulse.
  useEffect(() => {
    if (!live.listening) {
      return;
    }
    const id = setInterval(() => setAmp(0.35 + Math.random() * 0.65), 160);
    return () => clearInterval(id);
  }, [live.listening]);

  // Screen notification for auto-detect: pops once when a language is first
  // recognized and again on every switch — not on every segment, which would
  // spam. Explicit source picks never notify (the language is already chosen).
  const lastLangNotifiedRef = useRef<string | null>(null);

  // Recognition language is fixed per mic session, so a language change made
  // while listening must restart the session — otherwise the new selection
  // silently applies to nothing until the next mic tap. The key guards against
  // restarting on the tap that started the session in the first place.
  //
  // micLang is deliberately NOT in the key. It has no picker of its own — the
  // input selector drives it — so it can only change as a side effect of
  // start() reacting to sourceHints, which is already in the key. Listing it
  // would fire the effect a second time and flush the turn the user was
  // mid-way through saying.
  const startRef = useRef(live.start);
  startRef.current = live.start;
  const appliedRef = useRef("");
  const sessionKey = JSON.stringify([sourceHints, targetLangs]);
  useEffect(() => {
    if (!live.listening || demo) return;
    if (appliedRef.current === sessionKey) return;
    appliedRef.current = sessionKey;
    startRef.current(sourceHints, targetLangs);
  }, [live.listening, demo, sessionKey, sourceHints, targetLangs]);

  const toggleMic = () => {
    if (live.listening) {
      appliedRef.current = "";
      live.stop();
      return;
    }

    // Demo replays canned turns so the UI can be reviewed without a mic or a key.
    if (demo) {
      live.startDemo();
      return;
    }

    // No Web Speech (Firefox/Safari) means the real path can never work here, so
    // fall back to demo rather than leaving a dead button.
    if (!live.supported) {
      setDemo(true);
      live.startDemo();
      message.info("This browser has no Web Speech API — switched to DEMO");
      return;
    }

    if (targetLangs.length === 0) {
      message.warning("Pick at least one target language first");
      return;
    }

    appliedRef.current = sessionKey;
    live.start(sourceHints, targetLangs);
  };

  const feed = live.segments;
  const showEmpty = feed.length === 0 && !live.partial;
  const ringAmp = live.listening ? amp : 0;
  // The backend fans translations out concurrently, so object key order is
  // completion order — different on every card. Render in target order.
  const orderOf = (code: string) => {
    const i = targetLangs.indexOf(code);
    return i < 0 ? 999 : i;
  };

  useEffect(() => {
    if (sourceLabel !== "auto") return;
    if (feed.length === 0) {
      lastLangNotifiedRef.current = null;
      return;
    }
    const detected = feed[0]?.detectedSource;
    if (!detected || detected === lastLangNotifiedRef.current) return;
    lastLangNotifiedRef.current = detected;
    message.info(`Recognized language: ${labelOf(detected)}`);
  }, [feed, sourceLabel]);

  return (
    <div
      style={
        {
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: tokens.bg,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          "--fb-accent-soft": tokens.accentSoft,
        } as React.CSSProperties
      }
    >
      {/* This is a page, not a dialog: no modal chrome, no page scrollbar. The feed
          scrolls internally and its scrollbar is hidden. */}
      <style>{`
        .fb-feed { scrollbar-width: none; -ms-overflow-style: none; }
        .fb-feed::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>
      {/* ─── Header strip: brand, languages, connection ─── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px",
            background: isDark ? "rgba(15,17,21,.82)" : "rgba(249,250,251,.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${tokens.line}`,
            flexWrap: "wrap",
            rowGap: 10,
          }}
        >
          {/* ─── Language bar: fixed box, so hovering can never reflow the header ─── */}
          <div
            onMouseEnter={() => setLangsOpen(true)}
            onMouseLeave={() => setLangsOpen(false)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 44,
              width: 700,
              maxWidth: "100%",
              overflow: "visible",
              background: tokens.surface,
              border: `1px solid ${tokens.line}`,
              borderRadius: 999,
              padding: "0 14px",
              fontSize: 13,
            }}
          >
            <TranslationOutlined style={{ color: tokens.muted, flexShrink: 0 }} />

              {/* Input language doubles as the microphone language — Web Speech
                  only recognizes one language per session, so a second picker
                  would just be a second place for the two to disagree. Picking
                  one explicit language here tells the mic what to listen in;
                  Auto-detect or several languages leave the mic on whichever it
                  last used (remembered inside the hook). */}
              <Tooltip title="Input language — also what the microphone listens in">
                <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                  <Select
                    variant="borderless"
                    mode="multiple"
                    value={sourceLangs}
                    onChange={setSourceLangs}
                    maxTagCount={2}
                    placeholder="Input language"
                    style={{ minWidth: 168, fontSize: 13, flexShrink: 0 }}
                    options={SOURCE_OPTIONS}
                  />
                </span>
              </Tooltip>

              <span style={{ color: tokens.muted, flexShrink: 0 }}>→</span>

              {/* Always exactly MAX_CHIPS wide, so the bar never resizes. The rest of
                  the selection lives in the hover panel below, not inline. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                {targetLangs.slice(0, MAX_CHIPS).map((code) => (
                  <span
                    key={code}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: tokens.accentSoft,
                      color: "#EF4430",
                      fontSize: 12.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {labelOf(code)}
                    <span
                      role="button"
                      aria-label={`Remove ${labelOf(code)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetLangs((prev) => prev.filter((c) => c !== code));
                      }}
                      style={{ cursor: "pointer", opacity: 0.6, fontSize: 11 }}
                    >
                      ✕
                    </span>
                  </span>
                ))}

                {targetLangs.length > MAX_CHIPS && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: `1px dashed ${tokens.line}`,
                      color: tokens.muted,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{targetLangs.length - MAX_CHIPS}
                  </span>
                )}
              </div>

                <Select
                  variant="borderless"
                  mode="multiple"
                  value={[]}
                  onChange={(next) =>
                    setTargetLangs((prev) => [...new Set([...prev, ...next])].slice(0, 12))
                  }
                  placeholder="+ Add"
                  maxTagCount={0}
                  style={{ width: 96, flex: "0 0 96px", fontSize: 13 }}
                  options={LANGS.filter((l) => !targetLangs.includes(l.value))}
                />

            {/* Hover panel: absolutely positioned so revealing the full selection
                cannot shift the header or the feed. */}
            {langsOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "100%",
                  background: tokens.surface,
                  border: `1px solid ${tokens.line}`,
                  borderRadius: 16,
                  boxShadow: "0 16px 40px -12px rgba(17,24,39,.28)",
                  padding: 12,
                  zIndex: 20,
                  display: "grid",
                  gap: 8,
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: tokens.muted }}>
                  TARGET LANGUAGES ({targetLangs.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {targetLangs.length === 0 && (
                    <span style={{ fontSize: 12.5, color: tokens.muted }}>
                      No target languages selected
                    </span>
                  )}
                  {targetLangs.map((code) => (
                    <span
                      key={code}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: tokens.accentSoft,
                        color: "#EF4430",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      {labelOf(code)}
                      <span
                        role="button"
                        aria-label={`Remove ${labelOf(code)}`}
                        onClick={() => setTargetLangs((prev) => prev.filter((c) => c !== code))}
                        style={{ cursor: "pointer", opacity: 0.65, fontSize: 11 }}
                      >
                        ✕
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => {
              // DEMO only arms the mode — the mic button is what starts playback.
              // State is read outside the updater because updaters must stay pure.
              const next = !demo;
              setDemo(next);
              if (!next) live.stop();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: 999,
              padding: "4px 10px",
              border: `1px solid ${demo ? "#EF4430" : tokens.line}`,
              background: demo ? tokens.accentSoft : "transparent",
              color: demo ? "#EF4430" : tokens.muted,
            }}
          >
            <ThunderboltFilled />
            DEMO {demo ? "ON" : "OFF"}
          </button>

          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: demo ? "#f59e0b" : live.connected ? "#22c55e" : tokens.muted,
            }}
          >
            {demo ? <ThunderboltFilled /> : live.connected ? <CloudServerOutlined /> : <DisconnectOutlined />}
            {demo ? "DEMO MODE" : live.connected ? "SERVER CONNECTED" : "Connecting…"}
          </span>

          {/* Owner-only extras (e.g. the share button on the dashboard route). The public
            /live page omits this, so a guest never sees sharing controls. */}
            {headerExtra}

            <Tooltip title="Close (Esc)">
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `1px solid ${tokens.line}`,
                background: tokens.surface,
                color: tokens.muted,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </Tooltip>
        </div>

        {/* ─── Feed: the only scrollable region, so the page itself never scrolls ─── */}
        <div
          className="fb-feed"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            maxWidth: 1180,
            width: "100%",
            margin: "0 auto",
            padding: "24px 28px 132px",
          }}
        >
          <p style={{ fontSize: 13, color: tokens.muted, margin: "0 0 14px" }}>
            {feed.length
              ? `${feed.length} segments this session`
              : live.listening
                ? "Listening… speak naturally, pause between sentences."
                : "New session. Press the mic to start."}
          </p>

          {!live.supported && !demo && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                color: "#EF4430",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              <ExclamationCircleFilled />
              This browser has no Web Speech API — open the page in Chrome or Edge.
            </div>
          )}

          {live.error && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                color: "#EF4430",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              <ExclamationCircleFilled />
              {live.error}
            </div>
          )}

          {showEmpty ? (
            <div style={{ display: "grid", placeItems: "center", minHeight: "46vh" }}>
              <Empty description="Nothing yet. Translations will appear here as you speak." />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {live.partial && (
                <article
                  style={{
                    position: "relative",
                    background: tokens.surface,
                    borderRadius: 16,
                    padding: "18px 22px 18px 26px",
                    boxShadow: "0 1px 2px rgba(17,24,39,.06), 0 8px 24px -12px rgba(17,24,39,.18)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 10,
                      bottom: 10,
                      width: 4,
                      borderRadius: 999,
                      background: "linear-gradient(#EF4430,#F97316)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 12.5,
                      color: tokens.muted,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: tokens.ink, fontWeight: 600 }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: tokens.accentSoft,
                          color: "#EF4430",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        •
                      </span>
                      Speaking
                    </span>
                    <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                      <Equalizer />
                      <span>Listening</span>
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: sentenceSize(live.partial.length),
                      lineHeight: 1.45,
                      fontWeight: 500,
                      margin: 0,
                      color: tokens.ink,
                      opacity: 0.6,
                      maxWidth: "100%",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {live.partial}
                  </p>
                </article>
              )}

              {feed.map((seg) => {
                // seg.n is the creation order in this session, so the badge matches
                // "N segments this session" and never shifts when new turns arrive.
                const typing = !revealed[seg.id];
                // A card is "live" while either the text is still typing in or the
                // translations have not landed — that drives the accent bar and status.
                const liveCard = typing || !seg.done;
                return (
                  <article
                    key={seg.id}
                    style={{
                      position: "relative",
                      background: liveCard
                          ? `linear-gradient(90deg, ${tokens.accentSoft} 0%, ${tokens.surface} 38%)`
                          : tokens.surface,
                      borderRadius: 16,
                      padding: "18px 22px 18px 26px",
                      boxShadow: liveCard
                        ? "0 1px 2px rgba(17,24,39,.06), 0 10px 28px -14px rgba(239,68,48,.35)"
                        : "0 1px 2px rgba(17,24,39,.06), 0 8px 24px -12px rgba(17,24,39,.18)",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 10,
                        bottom: 10,
                        width: 4,
                        borderRadius: 999,
                        background: liveCard
                          ? "linear-gradient(#EF4430,#F97316)"
                          : tokens.line,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        color: tokens.muted,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: tokens.ink, fontWeight: 600 }}>
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: tokens.accentSoft,
                            color: "#EF4430",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {seg.n}
                        </span>
                        Segment {seg.n}
                      </span>
                      {inputBadgeOf(seg.detectedSource) && (
                        <Tooltip title="Input language for this turn">
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "1px 8px",
                              borderRadius: 999,
                              background: tokens.accentSoft,
                              color: "#EF4430",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: 0.3,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inputBadgeOf(seg.detectedSource)}
                          </span>
                        </Tooltip>
                      )}
                      <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                        {liveCard ? (
                          <>
                            <Equalizer active={!seg.done} />
                            <span>{typing ? "Transcribing" : "Translating"}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleFilled style={{ color: "#22c55e" }} />
                            <span>Final</span>
                          </>
                        )}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: sentenceSize(seg.text.length),
                        lineHeight: 1.4,
                        fontWeight: 500,
                        margin: 0,
                        color: tokens.ink,
                        maxWidth: "100%",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <Reveal
                        text={seg.text}
                        onDone={() =>
                          setRevealed((prev) => (prev[seg.id] ? prev : { ...prev, [seg.id]: true }))
                        }
                      />
                    </p>

                    <div
                      style={{
                        marginTop: 14,
                        display: "grid",
                        gap: 8,
                        color: tokens.muted,
                        lineHeight: 1.55,
                        opacity: seg.done ? 1 : 0.45,
                      }}
                    >
                      {Object.entries(seg.outputs)
                        .sort(([a], [b]) => orderOf(a) - orderOf(b))
                        .map(([code, text]) => (
                        <span
                          key={code}
                          style={{ display: "flex", gap: 14, fontSize: translationSize(text.length) }}
                        >
                          <em
                            style={{
                              fontStyle: "normal",
                              minWidth: 40,
                              fontSize: 11.5,
                              fontWeight: 700,
                              letterSpacing: 0.3,
                              color: "#EF4430",
                              opacity: 0.75,
                              paddingTop: 2,
                            }}
                          >
                            {shortOf(code)}
                          </em>
                          <span style={{ flex: 1, minWidth: 0 }}>{renderEmphasis(text)}</span>
                          {/* Pronunciation guide — pinyin for Chinese, romaji for
                              Japanese, respelling for English. Absent for every
                              other language, so the row simply isn't drawn. */}
                          {seg.romanizations?.[code] && (
                            <span
                              style={{
                                fontSize: 12,
                                color: tokens.muted,
                                fontStyle: "italic",
                                letterSpacing: 0.2,
                              }}
                            >
                              {seg.romanizations[code]}
                            </span>
                          )}
                        </span>
                      ))}
                      {Object.entries(seg.errors).map(([code]) => (
                        <span key={code} style={{ display: "flex", gap: 10, color: tokens.muted }}>
                          <em style={{ fontStyle: "normal", minWidth: 26, fontSize: 12, fontWeight: 600 }}>
                            {shortOf(code)}
                          </em>
                          {/* Raw backend errors stay in the server log — the card
                              shows a human line instead of leaking internals. */}
                          <span>Couldn't translate this turn — will retry on the next one.</span>
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Floating mic pill ─── */}
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 24,
            zIndex: 6,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "14px 28px",
              borderRadius: 999,
              background: isDark ? "rgba(23,26,32,.82)" : "rgba(255,255,255,.82)",
              backdropFilter: "blur(18px) saturate(1.4)",
              WebkitBackdropFilter: "blur(18px) saturate(1.4)",
              border: `1px solid ${tokens.line}`,
              boxShadow: "0 10px 40px rgba(17,24,39,.12)",
            }}
          >
            <button
              onClick={() => {
                live.clear();
                setRevealed({});
              }}
              style={actStyle(tokens.muted)}
            >
              <span style={circleStyle(tokens.surface, tokens.line, tokens.ink)}>
                <DeleteOutlined />
              </span>
              Clear
            </button>

            <button style={actStyle(tokens.muted)} onClick={() => live.clear()}>
              <span style={circleStyle(tokens.surface, tokens.line, tokens.ink)}>
                <RobotOutlined />
              </span>
              AI helper
            </button>

          <div
            style={{ position: "relative", width: 132, height: 84, display: "grid", placeItems: "center" }}
          >
            <span
              style={{
                position: "absolute",
                width: 132,
                height: 132,
                pointerEvents: "none",
                display: "grid",
                placeItems: "center",
              }}
            >
              {Array.from({ length: 28 }).map((_, i) => {
                const dist = Math.abs(i - 14) / 14;
                const h = 6 + ringAmp * 26 * (1 - dist * 0.55);
                return (
                  <i
                    key={i}
                    style={{
                      position: "absolute",
                      width: 3,
                      height: h,
                      borderRadius: 2,
                      background: "#EF4430",
                      opacity: ringAmp > 0 ? 0.25 + ringAmp * 0.6 : 0,
                      transform: `rotate(${(i * 360) / 28}deg) translateY(-52px)`,
                      transition: "height .12s, margin-top .12s",
                    }}
                  />
                );
              })}
            </span>

            <button
              onClick={toggleMic}
              aria-label="Start or stop listening"
              style={{
                position: "relative",
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: 0,
                cursor: "pointer",
                background: live.listening ? "#EF4430" : tokens.muted,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                boxShadow: live.listening
                  ? "0 0 0 6px rgba(239,68,48,.15), 0 0 30px rgba(239,68,48,.55)"
                  : "none",
                animation: live.listening ? "fbGlow 1.6s ease-in-out infinite" : "none",
                transition: "background .2s",
              }}
            >
              {live.listening ? (
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#fff" }} />
              ) : (
                <AudioOutlined style={{ fontSize: 26 }} />
              )}
            </button>
          </div>

          <button
            style={actStyle(tokens.muted)}
            onClick={() =>
              setTargetLangs((prev) => (prev.length ? [] : [...DEFAULT_TARGETS]))
            }
          >
            <span style={circleStyle(tokens.surface, tokens.line, tokens.ink)}>
              <TranslationOutlined />
            </span>
            Languages
          </button>
          </div>
        </div>
        <style>{`@keyframes fbGlow{50%{box-shadow:0 0 0 12px rgba(239,68,48,.08), 0 0 44px rgba(239,68,48,.7)}}`}</style>

        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 96,
            zIndex: 5,
            textAlign: "center",
            fontSize: 11.5,
            color: tokens.muted,
            background: isDark ? "rgba(15,17,21,.7)" : "rgba(255,255,255,.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "4px 12px",
            borderRadius: 999,
            border: `1px solid ${tokens.line}`,
            pointerEvents: "none",
          }}
        >
          {demo
            ? `DEMO · ${targetLangs.map(labelOf).join(", ") || "chưa chọn"}`
            : `Listening: ${sourceLabel} → ${targetLangs.map(labelOf).join(", ") || "chưa chọn"}`}
        </div>
    </div>
  );
}

const Equalizer = ({ active = true }: { active?: boolean }) => (
  <span style={{ display: "flex", gap: 2, alignItems: "center", height: 14 }}>
    {[0, 1, 2, 3].map((i) => (
      <i
        key={i}
        style={{
          width: 3,
          height: "100%",
          borderRadius: 2,
          background: active ? "#EF4430" : "currentColor",
          opacity: active ? 1 : 0.5,
          animationName: active ? "fbEq" : "none",
          animationDuration: ".9s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: `${i * 0.15}s`,
          transform: "scaleY(.3)",
        }}
      />
    ))}
    <style>{`@keyframes fbEq{50%{transform:scaleY(1)}}`}</style>
  </span>
);

const actStyle = (muted: string): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  border: 0,
  background: "transparent",
  color: muted,
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  width: 56,
});

const circleStyle = (surface: string, line: string, ink: string): React.CSSProperties => ({
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: surface,
  border: `1px solid ${line}`,
  display: "grid",
  placeItems: "center",
  color: ink,
  fontSize: 16,
});