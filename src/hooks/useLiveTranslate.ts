"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { createSilenceDetector, type SilenceDetector } from "./silenceDetector";

/** Web Speech API is prefixed on Chromium; Safari/Firefox either lack it or differ. */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
}

const recognitionCtor = () => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export interface LiveSegment {
  id: string;
  /** 1-based creation order in this session — stable, unlike position math. */
  n: number;
  text: string;
  outputs: Record<string, string>;
  errors: Record<string, string>;
  /** Pronunciation guide per output language (pinyin / romaji / respelling). */
  romanizations?: Record<string, string>;
  /** Source language detected for this turn (auto mode only). */
  detectedSource?: string | null;
  done: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Demo script — 20 canned turns so the UI can be reviewed without a Gemini key,
 * a microphone, or a browser that supports Web Speech.
 */
export const DEMO_LINES: { vi: string; zh: string; en: string; fr: string; es: string; hi: string; zhTW: string }[] = [
  {
    vi: "Ôi trời, anh biết không, lịch trình của em dạo này **kín mít** luôn.",
    zh: "哎呀，你知道我最近的行程安排得也很满。",
    en: "Oh my, you know, my schedule lately is completely packed.",
    fr: "Oh là là, mon emploi du temps est complètement plein en ce moment.",
    es: "Ay, ¿sabes?, últimamente mi agenda está completísima.",
    hi: "अरे, तुम्हें पता है, आजकल मेरा शेड्यूल बिल्कुल भरा हुआ है।",
    zhTW: "哎呀，你知道我最近的行程安排得也很滿。",
  },
  {
    vi: "Em sắp sang Pháp ăn một loại **bánh tráng miệng** gì đó.",
    zh: "我要去法国吃一种什么甜品。",
    en: "I'm about to go to France to try some kind of dessert.",
    fr: "Je vais bientôt en France goûter un dessert.",
    es: "Pronto iré a Francia a probar algún postre.",
    hi: "मैं जल्द ही फ्रांस जाकर कोई मिठाई चखने वाला हूँ।",
    zhTW: "我要去法國吃一種什麼甜品。",
  },
  {
    vi: "Một mặt tôi thấy nó rất **hài hước**, nó có một cảm xúc.",
    zh: "一方面我觉得它很逗，它有一种感情。",
    en: "On one hand I find it very funny; it has a feeling to it.",
    fr: "D'un côté je trouve ça très drôle, il y a une émotion.",
    es: "Por un lado me parece muy gracioso; tiene algo especial.",
    hi: "एक तरफ मुझे यह बहुत मज़ेदार लगता है; इसमें एक एहसास है।",
    zhTW: "一方面我覺得它很逗，它有一種感情。",
  },
  {
    vi: "Hôm nay mình bắt đầu **họp nhóm** lúc mười giờ nhé.",
    zh: "今天我们十点开始小组会议。",
    en: "Let's start today's team meeting at ten.",
    fr: "Commençons la réunion d'équipe à dix heures.",
    es: "Empecemos hoy la reunión del equipo a las diez.",
    hi: "चलो आज की टीम मीटिंग दस बजे शुरू करते हैं।",
    zhTW: "今天我們十點開始小組會議。",
  },
  {
    vi: "Xin chào, tôi là Nhu, hôm nay tôi sẽ **hướng dẫn** chuyến đi Mekong Delta của bạn.",
    zh: "你好，我是纽，今天我带你游览湄公河三角洲。",
    en: "Hi, I'm Nhu, and today I'll be guiding your Mekong Delta tour.",
    fr: "Bonjour, je suis Nhu, aujourd'hui je vous guide dans le delta du Mékong.",
    es: "Hola, soy Nhu y hoy seré tu guía en el delta del Mekong.",
    hi: "नमस्ते, मैं न्यू हूँ, और आज मैं तुम्हें मेकांग डेल्टा घुमाऊँगा।",
    zhTW: "你好，我是紐，今天我帶你遊覽湄公河三角洲。",
  },
  {
    vi: "Chính quyền đã **cưỡng chế** và buộc người dân di dời đến địa điểm mới.",
    zh: "当局强制要求居民搬迁到新地点。",
    en: "The authorities forced residents to relocate to a new site.",
    fr: "Les autorités ont forcé les habitants à déménager.",
    es: "Las autoridades obligaron a los vecinos a trasladarse.",
    hi: "अधिकारियों ने निवासियों को नई जगह जाने पर मजबूर किया।",
    zhTW: "當局強制要求居民搬遷到新地點。",
  },
  {
    vi: "Tôi muốn mua một chiếc **điện thoại** mới, nhưng giá hơi cao.",
    zh: "我想买一部新手机，但价格有点高。",
    en: "I want to buy a new phone, but the price is a bit high.",
    fr: "Je veux acheter un nouveau téléphone, mais le prix est un peu élevé.",
    es: "Quiero comprar un teléfono nuevo, pero el precio es un poco alto.",
    hi: "मैं एक नया फोन खरीदना चाहता हूँ, लेकिन कीमत थोड़ी ज़्यादा है।",
    zhTW: "我想買一部新手機，但價格有點高。",
  },
  {
    vi: "Bạn có thể **kiểm tra** lại giúp tôi không? Chỗ này hơi khó tìm.",
    zh: "你能帮我再确认一下吗？这里有点难找。",
    en: "Could you double-check for me? This place is hard to find.",
    fr: "Pouvez-vous vérifier pour moi ? C'est difficile à trouver ici.",
    es: "¿Puedes comprobarlo por mí? Este lugar es difícil de encontrar.",
    hi: "क्या तुम मेरे लिए दोबारा जाँच सकते हो? यह जगह ढूँढना मुश्किल है।",
    zhTW: "你能幫我再確認一下嗎？這裡有點難找。",
  },
  {
    vi: "Chúng ta sẽ **đi bộ** đến chợ thay vì đi xe.",
    zh: "我们走路去市场吧，不用坐车。",
    en: "Let's walk to the market instead of taking a car.",
    fr: "Allons-y à pied au marché au lieu de prendre la voiture.",
    es: "Vayamos al mercado a pie en lugar de ir en coche.",
    hi: "चलो गाड़ी के बजाय पैदल बाज़ार चलते हैं।",
    zhTW: "我們走路去市場吧，不用坐車。",
  },
  {
    vi: "Nhiệt độ hôm nay **lạnh** bất thường, bạn nhớ mặc áo khoác nhé.",
    zh: "今天天气异常寒冷，记得穿外套。",
    en: "It's unusually cold today, remember to wear a jacket.",
    fr: "Il fait anormalement froid aujourd'hui, n'oubliez pas votre veste.",
    es: "Hoy hace un frío inusual, recuerda ponerte la chaqueta.",
    hi: "आज असामान्य ठंड है, जैकेट पहनना याद रखना।",
    zhTW: "今天天氣異常寒冷，記得穿外套。",
  },
  {
    vi: "Tôi **không hiểu** câu này, bạn có thể nói chậm lại không?",
    zh: "我没听懂这句，你能说慢一点吗？",
    en: "I don't understand this sentence; can you speak more slowly?",
    fr: "Je ne comprends pas cette phrase, pouvez-vous parler plus lentement ?",
    es: "No entiendo esta frase; ¿puedes hablar más despacio?",
    hi: "मैं यह वाक्य नहीं समझा; क्या तुम धीरे बोल सकते हो?",
    zhTW: "我沒聽懂這句，你能說慢一點嗎？",
  },
  {
    vi: "Cả nhóm đã **tham gia** đầy đủ, không ai vắng mặt.",
    zh: "全员都参加了，没人缺席。",
    en: "The whole group attended; no one was absent.",
    fr: "Tout le groupe a participé, personne n'était absent.",
    es: "Todo el grupo asistió; nadie faltó.",
    hi: "पूरा समूह आया; कोई अनुपस्थित नहीं था।",
    zhTW: "全員都參加了，沒人缺席。",
  },
  {
    vi: "Anh có thể gửi cho tôi **hóa đơn** qua email không?",
    zh: "你能把发票发到我邮箱吗？",
    en: "Could you send me the invoice by email?",
    fr: "Pouvez-vous m'envoyer la facture par e-mail ?",
    es: "¿Puedes enviarme la factura por correo electrónico?",
    hi: "क्या तुम मुझे ईमेल से बिल भेज सकते हो?",
    zhTW: "你能把發票發到我郵箱嗎？",
  },
  {
    vi: "Con đường này **lâu** bị kẹt xe vào giờ cao điểm.",
    zh: "这条路在高峰期经常堵车。",
    en: "This road is often congested at peak hours.",
    fr: "Cette route est souvent embouteillée aux heures de pointe.",
    es: "Esta calle suele atascarse en hora punta.",
    hi: "इस सड़क पर पीक आवर्स में अक्सर जाम लगता है।",
    zhTW: "這條路在高峰期經常堵車。",
  },
  {
    vi: "Tôi muốn học **nấu ăn** Việt Nam, món nào dễ nhất?",
    zh: "我想学做越南菜，哪道最简单？",
    en: "I want to learn Vietnamese cooking; which dish is easiest?",
    fr: "Je veux apprendre la cuisine vietnamienne, quel plat est le plus facile ?",
    es: "Quiero aprender cocina vietnamita; ¿qué plato es el más fácil?",
    hi: "मैं वियतनामी खाना बनाना सीखना चाहता हूँ; कौन सा व्यंजन सबसे आसान है?",
    zhTW: "我想學做越南菜，哪道最簡單？",
  },
  {
    vi: "Đây là **một vài** gợi ý để bạn tham khảo.",
    zh: "这里有几个建议供你参考。",
    en: "Here are a few suggestions for you to consider.",
    fr: "Voici quelques suggestions pour vous.",
    es: "Aquí tienes algunas sugerencias.",
    hi: "तुम्हारे विचार के लिए यहाँ कुछ सुझाव हैं।",
    zhTW: "這裡有幾個建議供你參考。",
  },
  {
    vi: "Tôi sẽ **gọi** lại cho bạn sau khi cuộc họp kết thúc.",
    zh: "会议结束后我再打给你。",
    en: "I'll call you back after the meeting ends.",
    fr: "Je vous rappelerai après la réunion.",
    es: "Te llamaré cuando termine la reunión.",
    hi: "मीटिंग खत्म होने के बाद मैं तुम्हें वापस कॉल करूँगा।",
    zhTW: "會議結束後我再打給你。",
  },
  {
    vi: "Phía bên kia sông có một **làng chài** rất yên bình.",
    zh: "河对岸有一个很宁静的渔村。",
    en: "Across the river is a very peaceful fishing village.",
    fr: "De l'autre côté de la rivière se trouve un village de pêcheurs très paisible.",
    es: "Al otro lado del río hay un pueblo pesquero muy tranquilo.",
    hi: "नदी के उस पार एक बहुत शांत मछुआरा गाँव है।",
    zhTW: "河對岸有一個很寧靜的漁村。",
  },
  {
    vi: "Bạn đã **thử** món này chưa? Nó được coi là đặc sản của vùng.",
    zh: "你尝过这道菜吗？它被认为是当地的特产。",
    en: "Have you tried this dish? It's considered a local specialty.",
    fr: "Avez-vous goûté ce plat ? C'est une spécialité de la région.",
    es: "¿Has probado este plato? Es una especialidad de la región.",
    hi: "क्या तुमने यह व्यंजन चखा है? इसे स्थानीय विशेषता माना जाता है।",
    zhTW: "你嚐過這道菜嗎？它被認為是當地的特產。",
  },
  {
    vi: "Cảm ơn bạn rất nhiều, hôm nay là một ngày **tuyệt vời**.",
    zh: "非常感谢你，今天真是美好的一天。",
    en: "Thank you so much, today has been a wonderful day.",
    fr: "Merci beaucoup, aujourd'hui est une journée merveilleuse.",
    es: "Muchas gracias, hoy ha sido un día maravilloso.",
    hi: "बहुत-बहुत धन्यवाद, आज का दिन बहुत शानदार रहा।",
    zhTW: "非常感謝你，今天真是美好的一天。",
  },
];

/**
 * useLiveTranslate — browser speech recognition piped through the NestJS gateway.
 *
 * Split by responsibility:
 *   - The browser owns the mic and endpointing (it knows when the speaker pauses),
 *     so no audio is uploaded and interim results render instantly and free.
 *   - NestJS owns the translation key and does one call per finished turn,
 *     covering every target language at once.
 *
 * Pause-based segmentation: Web Speech emits a "final" chunk at every
 * micro-pause, so finals are accumulated into a turn buffer and the turn is
 * only sent when speech actually stops. Three stop rules, checked in order:
 *   1. The turn hit MAX_TURN_CHARS — flush immediately, never grow a paragraph.
 *   2. The turn ends with sentence punctuation — a short pause ends it.
 *   3. Any silence lasting PAUSE_MS ends the turn.
 * Interim text stays local (fast, free); only finished turns are translated.
 */
/**
 * Long enough to ride out a mid-sentence thinking pause (and the beat between
 * two speakers) without splitting one utterance into two segments. A turn that
 * genuinely ends in punctuation cuts far sooner, via SHORT_PAUSE_MS below.
 */
const PAUSE_MS = 1400;
const SHORT_PAUSE_MS = 600;
/**
 * Turn size caps. The cap is a runaway backstop, not a segment length — it
 * must sit above a normal sentence so ordinary long sentences are never cut
 * mid-clause. 280 covers the longest plausible single utterance in Latin
 * scripts and stays sane for CJK, where each character is a word.
 */
const MAX_TURN_CHARS = 280;
const MAX_TURN_MS = 25000;
const SENTENCE_END = /[.?!…。？！]["'”’)\]]?\s*$/;
/**
 * Restarting synchronously inside `onend` throws InvalidStateError and wedges
 * Chrome's recognizer, so restarts wait a beat and retry a few times before
 * giving up with a visible error instead of a silently dead mic.
 */
const RESTART_DELAY_MS = 250;
const MAX_RESTART_DELAY_MS = 3000;
const MAX_RESTART_TRIES = 12;
/**
 * Voice-activity detection on/off.
 *
 * The detector opens a second getUserMedia stream for energy analysis. That is
 * normally harmless, but on some machines competing capture streams degrade
 * Chrome's speech recognition — so this can be switched off at runtime to A/B
 * the two behaviours without a rebuild:
 *
 *   ?vad=0   old behaviour (timing driven by Web Speech result cadence)
 *   ?vad=1   force on
 *   (absent) on by default
 */
function vadEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const flag = new URLSearchParams(window.location.search).get("vad");
  if (flag === "0") return false;
  if (flag === "1") return true;
  return true;
}

export function useLiveTranslate() {
  const [supported] = useState(() => !!recognitionCtor());
  const [listening, setListening] = useState(false);
  const [connected, setConnected] = useState(false);
  const [partial, setPartial] = useState("");
  const [segments, setSegments] = useState<LiveSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  // What the microphone itself listens in. Web Speech accepts exactly one
  // language per session and cannot auto-detect it. The rule: one explicit
  // source pick drives the mic (sticky — it stays until changed); pure auto
  // starts from the browser locale, the best available guess at the user's
  // own language. Hardcoding any single default mis-transcribes everyone else.
  const [micLang, setMicLang] = useState(() => {
    const saved = loadLangs("fb.rt.mic", []);
    if (saved.length > 0) return saved[0];
    return fromBCP47(typeof navigator !== "undefined" ? navigator.language : "en");
  });

  useEffect(() => {
    saveLangs("fb.rt.mic", [micLang]);
  }, [micLang]);

  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  // start() can run before the socket finishes connecting (first click); the
  // config is parked here and flushed on connect so it is never silently lost.
  const pendingStartRef = useRef<{ from: string[]; to: string[] } | null>(null);
  // Pause segmentation: finals accumulate here until silence flushes the turn.
  const turnRef = useRef("");
  // Latest interim transcript. Chrome streams interim for minutes with rare
  // finals under constant audio, so a gap must flush this too — otherwise the
  // pause finalizes nothing and one mega-final lands minutes later.
  const interimRef = useRef("");

  /**
   * Highest FINAL result index already folded into the current turn.
   *
   * Finals are permanent, so each is consumed exactly once — that is what
   * stops Chrome's re-deliveries from looping a sentence back in. Interims are
   * deliberately NOT tracked here: Chrome revises the one in progress at a
   * fixed index, so they must be re-read every event. The counter is reset
   * whenever a new recognition object is created, since Chrome restarts its
   * index space at 0 per session.
   */
  const consumedFinalsRef = useRef(0);
  // Longest transcript seen this session (high-water mark). Finals restate the
  // whole utterance every time, so only the unseen tail is new — without this
  // each growing final retransmits everything (50 cards, one sentence).
  const spokenRef = useRef("");
  // When the current turn's first chunk arrived — bounds total turn length.
  const turnStartRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Voice-activity detector. When it is running it is authoritative about when
   * a turn ends; the result-driven silence timer below is only a fallback for
   * browsers or devices where the mic cannot be opened a second time.
   */
  const vadRef = useRef<SilenceDetector | null>(null);
  /** Set when the mic could not be opened, so we don't retry every restart. */
  const vadUnavailableRef = useRef(false);
  // start() args, kept current for the silence timer which fires later.
  const configRef = useRef<{ from: string[]; to: string[] }>({ from: [], to: [] });
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTriesRef = useRef(0);
  const segmentIdRef = useRef("");
  const seqRef = useRef(0);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoIndexRef = useRef(0);

  const patch = useCallback((id: string, next: Partial<LiveSegment>) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...next } : s)));
  }, []);

  const ensureSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;

    const socket = io(`${API}/translation-live`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const pending = pendingStartRef.current;
      pendingStartRef.current = null;
      if (pending && wantListeningRef.current) socket.emit("live:start", pending);
    });
    socket.on("disconnect", () => setConnected(false));

    // The speaker finished: lock the text in immediately so the card stops moving,
    // then show translations when the gateway answers.
    socket.on("live:final", (p: { id: string; text: string }) => {
      segmentIdRef.current = p.id;
      const n = ++seqRef.current;
      setSegments((prev) => [
        {
          id: p.id,
          n,
          text: p.text,
          outputs: {},
          errors: {},
          detectedSource: null,
          done: false,
        },
        ...prev,
      ]);
    });

    socket.on(
      "live:translation",
      (p: {
        id: string;
        outputs: Record<string, string>;
        errors: Record<string, string>;
        romanizations?: Record<string, string>;
        detectedSource?: string | null;
      }) => {
        patch(p.id, {
          outputs: p.outputs ?? {},
          errors: p.errors ?? {},
          romanizations: p.romanizations ?? {},
          detectedSource: p.detectedSource ?? null,
          done: true,
        });
      },
    );

    socket.on("live:error", (p: { message?: string }) => {
      setError(p?.message || "Translation failed");
      if (segmentIdRef.current) patch(segmentIdRef.current, { done: true });
    });

    return socket;
  }, [patch]);

  const sendFinal = useCallback(
    (text: string, from: string[], to: string[]) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      // `from` is a list on purpose: one code means "trust this source", while an
      // empty list tells the model to auto-detect each utterance.
      ensureSocket().emit("live:translate", { text: trimmed, from, to });
    },
    [ensureSocket],
  );

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  /** Re-enter listening after Chrome ends the session, with backoff. */
  const tryRestart = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    if (!wantListeningRef.current) return;
    if (restartTriesRef.current >= MAX_RESTART_TRIES) {
      wantListeningRef.current = false;
      setListening(false);
      setError("Microphone stopped unexpectedly — tap the mic to retry.");
      return;
    }
    restartTriesRef.current++;
    const delay = Math.min(RESTART_DELAY_MS * restartTriesRef.current, MAX_RESTART_DELAY_MS);
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (!wantListeningRef.current) return;
      try {
        recognitionRef.current?.start();
      } catch {
        tryRestart();
      }
    }, delay);
  }, []);

  /** Silence lasted long enough — the turn is over, send it as one segment. */
  const flushTurn = useCallback(() => {
    clearSilenceTimer();
    const text = `${turnRef.current} ${interimRef.current}`.trim();
    turnRef.current = "";
    interimRef.current = "";
    turnStartRef.current = 0;
    if (!text) return;
    spokenRef.current = text;
    const { from, to } = configRef.current;
    setPartial("");
    sendFinal(text, from, to);
  }, [clearSilenceTimer, sendFinal]);

  /**
   * armSilenceTimer — Schedule the fallback cut.
   *
   * When the voice-activity detector is live it owns this decision, so nothing
   * is scheduled: Web Speech's result cadence is too unreliable to time a turn,
   * and arming here is what caused turns to be cut mid-word or to run on
   * forever. The detector fires flushTurn itself on genuine silence.
   *
   * Without the detector (mic already in use, or permission refused) we keep
   * the old behaviour, which is imperfect but strictly better than nothing.
   */
  const armSilenceTimer = useCallback(
    (ms: number = PAUSE_MS) => {
      if (vadRef.current) return;
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(flushTurn, ms);
    },
    [clearSilenceTimer, flushTurn],
  );

  /**
   * startSilenceDetection — Open a parallel mic stream for energy analysis.
   *
   * Web Speech keeps its own capture; this adds a second, analysis-only stream.
   * Fails soft: on any error we simply keep using the fallback timer.
   */
  const startSilenceDetection = useCallback(async () => {
    if (!vadEnabled()) return;
    if (vadUnavailableRef.current || vadRef.current) return;
    const vad = createSilenceDetector(PAUSE_MS);
    // A turn is only ended once we know something was actually said, and the
    // VAD cannot know that — it only hears energy. Guard on the turn buffer.
    vad.onSilence(() => {
      if (turnRef.current.trim() || interimRef.current.trim()) flushTurn();
    });
    const ok = await vad.start();
    if (ok) {
      vadRef.current = vad;
    } else {
      vadUnavailableRef.current = true;
    }
  }, [flushTurn]);

  const stopSilenceDetection = useCallback(() => {
    vadRef.current?.stop();
    vadRef.current = null;
  }, []);

  const start = useCallback(
    (sourceLangs: string[], targets: string[]) => {
      if (!supported) {
        setError("This browser has no speech recognition. Please use Chrome or Edge.");
        return;
      }
      setError(null);
      wantListeningRef.current = true;
      // A restart (e.g. language switch) must not eat the unfolding turn:
      // send it under the previous config before reconfiguring.
      flushTurn();
      configRef.current = { from: sourceLangs, to: targets };
      turnRef.current = "";
      interimRef.current = "";
      spokenRef.current = "";
      turnStartRef.current = 0;
      clearSilenceTimer();
      // Real-silence detection takes over timing for this session. It survives
      // a recognition restart (Chrome ends its own sessions), so it is only
      // started once — re-running it per session would churn mic handles.
      void startSilenceDetection();

      const socket = ensureSocket();
      pendingStartRef.current = { from: sourceLangs, to: targets };
      if (socket.connected) {
        socket.emit("live:start", pendingStartRef.current);
        pendingStartRef.current = null;
      }

      const Ctor = recognitionCtor();
      if (!Ctor) return;

      // A stale session (e.g. after a failed restart) must be torn down first:
      // two live recognitions wedge Chrome's speech service.
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Already dead — nothing to do.
        }
        recognitionRef.current = null;
      }
      clearRestartTimer();
      restartTriesRef.current = 0;

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      // New session, new index space — clear the watermark from the last one.
      consumedFinalsRef.current = 0;
      // Exactly ONE explicit source = the user told us the language, so the mic
      // follows it (and remembers for later auto sessions). Two or more is not
      // a statement about what to listen in, so micLang is left alone.
      const explicit = sourceLangs.filter((l) => l && l !== "auto");
      const picked = explicit.length === 1 ? explicit[0] : null;
      const effectiveMic = picked ?? micLang;
      if (picked) setMicLang(picked);
      recognition.lang = BCP47(effectiveMic);

      recognition.onstart = () => {
        restartTriesRef.current = 0;
        setListening(true);
      };

      recognition.onresult = (event) => {
        // A previous session's late events must never pollute the live one.
        if (recognitionRef.current !== recognition) return;
        // `event.results` is cumulative and Chrome re-delivers results it has already
        // sent. Walking a final twice used to replay the previous sentence:
        // once a flush cleared spokenRef, an old final no longer matched the
        // "stale echo" prefix check, so its words were diffed in as new ones.
        //
        // Only FINALS are watermarked. Interims must be re-read on every event
        // because Chrome revises the one in progress in place at the same
        // index — marking them spent made the live caption blank out and threw
        // away every word that never became a final.
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            if (i < consumedFinalsRef.current) continue; // already folded in
            consumedFinalsRef.current = i + 1;
            // Finals restate the whole utterance and revisions rewrite earlier
            // words, so diff against the longest transcript seen: only the new
            // tail is kept, word-boundary aligned. A shorter repeat is a stale
            // echo — drop it, don't resend.
            const f = transcript.trim();
            const base = spokenRef.current;
            if (f) {
              if (!base) {
                turnRef.current = appendChunk(turnRef.current, f);
                spokenRef.current = f;
              } else if (base.startsWith(f)) {
                // Stale echo — ignore.
              } else if (f.startsWith(base)) {
                const tail = f.slice(base.length).trim();
                if (tail) turnRef.current = appendChunk(turnRef.current, tail);
                spokenRef.current = f;
              } else {
                let i = 0;
                const n = Math.min(base.length, f.length);
                while (i < n && base[i] === f[i]) i++;
                const cut = f.lastIndexOf(" ", i);
                const tail = (cut >= 0 ? f.slice(cut + 1) : f).trim();
                if (tail) turnRef.current = appendChunk(turnRef.current, tail);
                if (f.length >= base.length) spokenRef.current = f;
              }
            }
          } else {
            interim += transcript;
          }
        }
        interimRef.current = interim;
        // Show the whole unfolding turn live; its card is created on pause-flush.
        const unfolding = `${turnRef.current} ${interimRef.current}`.trim();
        // Runaway turn: cut it now instead of growing a paragraph — by size
        // (150 chars is already a full turn) or by age (25s of nonstop talk).
        if (!turnStartRef.current && unfolding) turnStartRef.current = Date.now();
        if (
          unfolding.length >= MAX_TURN_CHARS ||
          (turnStartRef.current > 0 && Date.now() - turnStartRef.current >= MAX_TURN_MS)
        ) {
          flushTurn();
          return;
        }
        // Everything up to here is now spent — never walk these indices again.
if (unfolding) setPartial(unfolding);
        // A finished sentence needs only a short pause to be done; a
        // mid-sentence pause gets the full beat before it cuts the turn.
        // Test the WHOLE unfolding turn, not just the finals: Chrome delivers
        // punctuation as interim text first, so checking turnRef alone missed
        // the sentence end and waited the full long pause anyway — the turn ran
        // on into the next speaker.
        armSilenceTimer(SENTENCE_END.test(unfolding) ? SHORT_PAUSE_MS : PAUSE_MS);
      };

      // Chrome ends the session on its own after a silence; the turn that the
      // silence ended gets flushed first, then listening resumes gap-free.
      // Stale sessions (torn down by a restart) stay fully silent: flushing
      // here would eat the live session's unfolding turn, and restarting here
      // would kill it — that was the freeze.
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        setListening(false);
        flushTurn();
        if (wantListeningRef.current) tryRestart();
      };

      recognition.onerror = (e) => {
        if (recognitionRef.current !== recognition) return;
        const err = e?.error;
        if (err === "not-allowed" || err === "service-not-allowed") {
          wantListeningRef.current = false;
          clearRestartTimer();
          clearSilenceTimer();
          setListening(false);
          setError("Microphone permission denied.");
        } else if (err === "network" || err === "audio-capture") {
          // Speech servers hiccuped or the device went away: stop cleanly with
          // a visible message so a tap retries, instead of a frozen mic.
          wantListeningRef.current = false;
          clearRestartTimer();
          clearSilenceTimer();
          setListening(false);
          setError(
            err === "network"
              ? "Speech service unreachable — tap the mic to retry."
              : "Microphone unavailable — tap the mic to retry.",
          );
        }
        // "no-speech" and "aborted" are normal during pauses — ignore them.
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // Already running — nothing to do.
      }
    },
    [ensureSocket, sendFinal, supported, micLang, clearSilenceTimer, clearRestartTimer, tryRestart, armSilenceTimer, flushTurn, startSilenceDetection],
  );

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    pendingStartRef.current = null;
    clearRestartTimer();
    restartTriesRef.current = 0;
    clearSilenceTimer();
    // Release the analysis mic too — leaving it open would hold the device and
    // show a recording indicator long after the mic button is off.
    stopSilenceDetection();
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setPartial("");
    setListening(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    socketRef.current?.emit("live:stop");
  }, [clearRestartTimer, clearSilenceTimer, stopSilenceDetection]);

  /**
   * startDemo — replay the canned script through the exact same UI path as a real
   * turn (partial → final → translations) so the UI can be judged without a key.
   * No socket and no mic are involved, so this works in any browser.
   */
  const startDemo = useCallback(() => {
    setError(null);
    setListening(true);
    demoIndexRef.current = 0;

    // A previous run's pending timers would keep injecting turns after a restart.
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];

    const play = () => {
      const line = DEMO_LINES[demoIndexRef.current % DEMO_LINES.length];
      demoIndexRef.current++;
      const words = line.vi.split(" ");
      const id = `demo-${demoIndexRef.current}-${Date.now().toString(36)}`;

      let i = 0;
      const step = () => {
        i++;
        setPartial(words.slice(0, i).join(" "));
        if (i < words.length) {
          demoTimersRef.current.push(setTimeout(step, 90));
          return;
        }

        setPartial("");
        const n = ++seqRef.current;
        setSegments((prev) => [{ id, n, text: line.vi, outputs: {}, errors: {}, detectedSource: "vi", done: false }, ...prev]);
        demoTimersRef.current.push(
          setTimeout(() => {
            patch(id, {
              outputs: { "zh-CN": line.zh, en: line.en, fr: line.fr, es: line.es, vi: line.vi, hi: line.hi, "zh-TW": line.zhTW },
              done: true,
            });
            // A short gap between turns so cards land like real speech, not a burst.
            demoTimersRef.current.push(setTimeout(play, 3200));
          }, 900),
        );
      };

      step();
    };

    demoTimersRef.current.push(setTimeout(play, 700));
  }, [patch]);

  const clear = useCallback(() => {
    setSegments([]);
    setPartial("");
    setError(null);
    seqRef.current = 0;
    turnRef.current = "";
    interimRef.current = "";
    spokenRef.current = "";
  }, []);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      demoTimersRef.current.forEach(clearTimeout);
      demoTimersRef.current = [];
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Memoised so consumers can safely use it as an effect dependency — returning a
  // fresh object every render would re-run their effects on every single render.
  return useMemo(
    () => ({
      supported,
      listening,
      connected,
      partial,
      segments,
      error,
      micLang,
      setMicLang,
      start,
      startDemo,
      stop,
      clear,
    }),
    [supported, listening, connected, partial, segments, error, micLang, start, startDemo, stop, clear],
  );
}

/** Append a final chunk, skipping exact repeats from session restarts. */
function appendChunk(buffer: string, chunk: string): string {
  const c = chunk.trim();
  if (!c) return buffer;
  if (!buffer) return c;
  if (buffer.endsWith(c)) return buffer;
  return `${buffer} ${c}`;
}

/** Map our language codes onto the BCP-47 tags Web Speech expects. */
function BCP47(code: string): string {
  const map: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    hi: "hi-IN",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    ja: "ja-JP",
    ko: "ko-KR",
  };
  return map[code] ?? code;
}
/** Browser locale (vi-VN, en-US, …) back onto our language codes. */
function fromBCP47(tag: string): string {
  const base = tag.split("-")[0].toLowerCase();
  const known = ["vi", "en", "zh-CN", "zh-TW", "fr", "de", "es", "ja", "ko", "hi"];
  if (known.includes(tag)) return tag;
  if (base === "zh") return tag.toLowerCase().includes("hant") ? "zh-TW" : "zh-CN";
  if (["vi", "en", "fr", "de", "es", "ja", "ko", "hi"].includes(base)) return base;
  return "en";
}

/** Language choices persist across reloads so setup is once-ever, not once-per-visit. */
export function loadLangs(key: string, fallback: string[]): string[] {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((v): v is string => typeof v === "string")
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

export function saveLangs(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode etc. — persistence is a convenience, never a requirement.
  }
}