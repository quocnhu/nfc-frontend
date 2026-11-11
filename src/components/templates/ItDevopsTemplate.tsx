"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- three.js is loaded from
   a CDN at runtime and has no bundled types; the imperative scene code is
   ported from the standalone template and uses dynamic three objects. */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  COL,
  EMOJI,
  PATHS,
  Row,
  TemplateProps,
  formatRole,
  kindOf,
  loadThree,
  openHref,
} from "./template-utils";

type Mode = "guide" | "dev";
type Lang = "vi" | "en";

const NOTE = "NFC Project, designed by Nguyễn Quốc Nhu";

interface ModeData {
  role: string;
  bio: string;
  props: string[];
  switchMsg: string;
  msgs: (n: string) => string[];
  tips: string[];
}

const MODES: Record<Lang, Record<Mode, ModeData>> = {
  vi: {
    guide: {
      role: "Hướng dẫn viên du lịch",
      bio: "Đồng hành cùng bạn khám phá miền Trung, từ phố cổ đến những bãi biển đẹp nhất.",
      props: ["🗺️", "🧭", "📸", "🎒"],
      switchMsg: "Chế độ hướng dẫn viên: sẵn sàng lên đường!",
      msgs: (n: string) => [
        `Xin chào! Mình là ${n}, hướng dẫn viên của bạn!`,
        "Theo mình nhé, điểm đến đẹp lắm đó!",
        "Nhớ mang mũ nón và nước uống nha!",
        "Chạm vào các biểu tượng để liên hệ nhé!",
      ],
      tips: [
        "Kiểm tra thời tiết trước ngày khởi hành nhé.",
        "Mang theo giấy tờ tùy thân và bản sao quan trọng.",
        "Mùa cao điểm nên đặt tour sớm để có chỗ đẹp.",
        "Dành thời gian ngắm hoàng hôn thật chậm nhé!",
      ],
    },
    dev: {
      role: "IT DevOps Engineer",
      bio: "Xây dựng hạ tầng cloud, CI/CD và giám sát để hệ thống chạy ổn định 24/7.",
      props: ["🐳", "☸️", "⚙️", "🔐"],
      switchMsg: "Robot DevOps online, hệ thống chạy ổn định!",
      msgs: (n: string) => [
        `Bíp bíp! Mình là robot trợ lý của ${n}.`,
        "Pipeline đang xanh, mọi thứ đều ổn!",
        "Cần dựng hạ tầng hay tự động hóa? Nhắn mình nhé!",
        "Chạm vào các biểu tượng để liên hệ nhé!",
      ],
      tips: [
        "Tự động hóa mọi việc lặp lại bằng CI/CD.",
        "Luôn sao lưu trước khi triển khai thay đổi lớn.",
        "Giám sát tốt giúp phát hiện sự cố sớm hơn.",
        "Cấp đúng quyền cần thiết, không hơn, để hệ thống an toàn.",
      ],
    },
  },
  en: {
    guide: {
      role: "Tour Guide",
      bio: "Join me to explore Central Vietnam, from ancient towns to the most beautiful beaches.",
      props: ["🗺️", "🧭", "📸", "🎒"],
      switchMsg: "Tour guide mode: ready to hit the road!",
      msgs: (n: string) => [
        `Hello! I'm ${n}, your tour guide!`,
        "Follow me, the destinations are gorgeous!",
        "Remember to bring a hat and water!",
        "Tap the icons to get in touch!",
      ],
      tips: [
        "Check the weather before departure day.",
        "Bring your ID and copies of important documents.",
        "In peak season, book tours early for the best spots.",
        "Take time to enjoy the sunset slowly!",
      ],
    },
    dev: {
      role: "IT DevOps Engineer",
      bio: "Building cloud infrastructure, CI/CD and monitoring so systems run reliably 24/7.",
      props: ["🐳", "☸️", "⚙️", "🔐"],
      switchMsg: "DevOps robot online, systems running stable!",
      msgs: (n: string) => [
        `Beep boop! I'm ${n}'s assistant robot.`,
        "Pipeline is green, everything is fine!",
        "Need infrastructure or automation? Message me!",
        "Tap the icons to get in touch!",
      ],
      tips: [
        "Automate repetitive work with CI/CD.",
        "Always back up before major changes.",
        "Good monitoring catches incidents earlier.",
        "Grant only the permissions needed to keep systems safe.",
      ],
    },
  },
};

const UI: Record<
  Lang,
  {
    guideTab: string;
    devTab: string;
    modeLabel: string;
    foldLabel: string;
    canvasLabel: string;
    hint: string;
    plane: string;
    robot: string;
    satellite: string;
    evCar: string;
  }
> = {
  vi: {
    guideTab: "🧭 Hướng dẫn viên",
    devTab: "💻 IT DevOps",
    modeLabel: "Chọn công việc",
    foldLabel: "Thu gọn hoặc mở rộng thông tin",
    canvasLabel: "Hòn đảo 3D toàn màn hình: hướng dẫn viên cầm cờ đi dạo quanh, hoặc robot DevOps chạy giữa các máy chủ",
    hint: "Chạm vào mình để chào nhé!",
    plane: "Chuyến bay khám phá sắp cất cánh!",
    robot: "Robot chạy tới xem nội dung của bạn nè!",
    satellite: "Vệ tinh đang đồng bộ dữ liệu về trung tâm.",
    evCar: "Xe điện bay tự lái đang giao hàng nhanh, đúng giờ.",
  },
  en: {
    guideTab: "🧭 Tour Guide",
    devTab: "💻 IT DevOps",
    modeLabel: "Choose a role",
    foldLabel: "Collapse or expand info",
    canvasLabel: "Full-screen 3D island: a tour guide walking with a flag, or a DevOps robot moving between servers",
    hint: "Tap me to say hello!",
    plane: "The adventure flight is about to take off!",
    robot: "The robot is coming over to check out your content!",
    satellite: "A satellite is syncing data back to the hub.",
    evCar: "An autonomous flying EV is delivering fast, on time.",
  },
};

const AV: Record<Mode, string> = {
  guide: `<svg viewBox="0 0 100 100" role="img" aria-label="Avatar hướng dẫn viên"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fd8ff"/><stop offset="1" stop-color="#2ee0c0"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag)"/><path d="M14 100c2-20 16-30 36-30s34 10 36 30z" fill="#ff6b3d"/><path d="M42 72l8 10 8-10z" fill="#fff"/>
<rect x="44" y="60" width="12" height="14" rx="5" fill="#f0c4a0"/><circle cx="50" cy="46" r="21" fill="#f6cfae"/>
<path d="M27 42a23 20 0 0 1 46 0z" fill="#ffc83d"/><rect x="22" y="40" width="56" height="6" rx="3" fill="#ffb21f"/><rect x="27" y="35" width="46" height="4" fill="#e5483a"/>
<circle cx="42" cy="52" r="2.6" fill="#2a1a12"/><circle cx="58" cy="52" r="2.6" fill="#2a1a12"/><path d="M43 60q7 6 14 0" fill="none" stroke="#2a1a12" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="37" cy="58" r="3.4" fill="#ff9c8a" opacity=".7"/><circle cx="63" cy="58" r="3.4" fill="#ff9c8a" opacity=".7"/></svg>`,
  dev: `<svg viewBox="0 0 100 100" role="img" aria-label="Avatar DevOps"><defs><linearGradient id="ag2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#1fd1e0"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag2)"/><path d="M12 100c2-22 16-32 38-32s36 10 38 32z" fill="#3f319f"/><path d="M36 70q14 12 28 0l-2-6H38z" fill="#2b2170"/>
<rect x="44" y="60" width="12" height="12" rx="5" fill="#f0c4a0"/><circle cx="50" cy="46" r="21" fill="#f6cfae"/>
<path d="M29 44a21 19 0 0 1 42 0v-3c0-11-9-19-21-19s-21 8-21 19z" fill="#1b1420"/>
<path d="M26 47a24 24 0 0 1 48 0" fill="none" stroke="#1d1d2b" stroke-width="4.5" stroke-linecap="round"/><rect x="22" y="44" width="8" height="15" rx="4" fill="#1d1d2b"/><rect x="70" y="44" width="8" height="15" rx="4" fill="#1d1d2b"/>
<circle cx="42" cy="51" r="6.2" fill="none" stroke="#1d1d2b" stroke-width="1.8"/><circle cx="58" cy="51" r="6.2" fill="none" stroke="#1d1d2b" stroke-width="1.8"/><path d="M48 51h4" stroke="#1d1d2b" stroke-width="1.8"/>
<circle cx="42" cy="51" r="2.2" fill="#2a1a12"/><circle cx="58" cy="51" r="2.2" fill="#2a1a12"/><path d="M44 61q6 5 12 0" fill="none" stroke="#2a1a12" stroke-width="2.2" stroke-linecap="round"/>
<rect x="68" y="76" width="22" height="16" rx="4" fill="#0f1a2b"/><path d="M73 81l4 3-4 3" fill="none" stroke="#35ffb0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M80 87h5" stroke="#35ffb0" stroke-width="2" stroke-linecap="round"/></svg>`,
};

const CSS = `
.it-template{--bg:#062a33;--bg2:#0e5b66;--card:rgba(8,48,58,.76);--line:rgba(140,235,230,.26);--text:#effffd;--muted:#a3cfcc;--sun:#ffc83d;--coral:#ff6b4a;--lagoon:#2ee0c0;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Baloo 2",system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:500}
.it-template *{box-sizing:border-box;margin:0}
.it-template .stage{position:fixed;inset:0;background:linear-gradient(180deg,#5ec3ff 0,#aee4ff 55%,#fff0c8 100%)}
.it-template #gl{position:relative;z-index:1;width:100%;height:100%;display:block;touch-action:none}
.it-template .sky2{position:absolute;inset:0;opacity:0;transition:opacity .8s;background:radial-gradient(circle at 20% 20%,#fff 0 1px,transparent 2px),radial-gradient(circle at 70% 12%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 85% 38%,#fff 0 1px,transparent 2px),radial-gradient(circle at 40% 8%,#cde 0 1px,transparent 2px),radial-gradient(circle at 12% 45%,#fff 0 1px,transparent 2px),radial-gradient(circle at 60% 30%,#fff 0 1px,transparent 2px),linear-gradient(180deg,#120e3d 0,#2a2a7c 55%,#0f6a82 100%)}
.it-template .stage.dev .sky2{opacity:1}
.it-template .top{position:absolute;z-index:6;left:10px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,40,60,.5)}
.it-template .top button{border:0;background:transparent;font:inherit;font-weight:700;font-size:11px;padding:4px 8px;border-radius:999px;cursor:pointer;color:#16414d}
.it-template .top button.on{background:#0a7f96;color:#fff}
.it-template .switch{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:4;display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,40,60,.5)}
.it-template .switch button{border:0;background:transparent;font:inherit;font-weight:700;font-size:14px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#16414d;white-space:nowrap}
.it-template .switch button.on{background:linear-gradient(90deg,#ff8a4a,#ffc83d);color:#2a1200}
.it-template .stage.dev .switch button.on{background:linear-gradient(90deg,#7a5cff,#1fd1e0);color:#fff}
.it-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:240px;padding:8px 13px;border-radius:14px;background:#fff;color:#08303b;font-size:14px;font-weight:600;line-height:1.35;text-align:center;box-shadow:0 6px 18px -8px rgba(0,60,80,.5);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.it-template .bubble.on{opacity:1;transform:translateX(-50%)}
.it-template .card{position:fixed;z-index:5;left:0;right:0;bottom:0;max-height:58vh;max-height:58dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,30,50,.5);transition:max-height .35s ease}
.it-template .card.min{max-height:215px}
.it-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.it-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid var(--bg);background:#fff;box-shadow:0 8px 22px -8px rgba(0,0,0,.5);overflow:hidden}
.it-template .avatar svg,.it-template .avatar img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.it-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.it-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.it-template .card.min .fold svg{transform:rotate(180deg)}
.it-template .who{text-align:center}
.it-template h1{font-size:27px;font-weight:800;line-height:1.15}
.it-template .role{display:inline-block;margin-top:8px;padding:4px 14px;border-radius:12px;background:color-mix(in srgb,var(--sun) 15%,transparent);border:1px solid color-mix(in srgb,var(--sun) 42%,transparent);color:var(--sun);font-size:12px;font-weight:600;letter-spacing:.5px}
.it-template .bio{margin:6px auto 0;max-width:34ch;color:var(--muted);font-size:15px;line-height:1.4}
.it-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.it-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--text);background:color-mix(in srgb,var(--sun) 14%,transparent)}
.it-template .rows{display:grid;gap:10px;margin-top:16px}
.it-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.it-template a.row:hover,.it-template a.row:active{border-color:var(--sun);transform:translateY(-1px)}
.it-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px;overflow:hidden}
.it-template .ico img{width:24px;height:24px;object-fit:contain}
.it-template .row span{font-size:16px;font-weight:600;line-height:1.25;word-break:break-word}
.it-template .note{margin-top:10px;text-align:center;font-size:11.5px;line-height:1.5;color:var(--muted)}
.it-template .stage.dev + .card{--text:#effffd;--muted:#a9d6d2;--line:rgba(140,255,200,.28);--sun:#ffc83d;--lagoon:#2ee0c0;--bg:#07222c;background:rgba(6,28,40,.38);backdrop-filter:blur(9px) saturate(1.6);box-shadow:0 -14px 70px -18px rgba(118,185,0,.45),inset 0 1px 0 rgba(180,255,120,.25)}
.it-template .stage.dev + .card .row{background:rgba(5,24,34,.4)}
.it-template .stage.dev + .card .scroll{text-shadow:0 1px 6px rgba(0,20,30,.75)}
@media (max-width:560px){
.it-template .switch{left:auto;right:8px;transform:none;top:calc(env(safe-area-inset-top,0px) + 12px)}
.it-template .switch button{font-size:11px;padding:4px 8px}
.it-template .bubble{top:calc(env(safe-area-inset-top,0px) + 54px)}
}
@media (min-width:860px){
.it-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,30,50,.5)}
.it-template .card.min{max-height:none}
.it-template .avatar{position:relative;top:auto;left:auto;margin:30px 0 0 24px}
.it-template .scroll{padding:14px 24px 28px;flex:1}
.it-template .fold{display:none}
.it-template .switch,.it-template .bubble{left:calc((100% - var(--panel))/2)}
.it-template .who{text-align:left}.it-template .bio{margin-left:0}.it-template .chips{justify-content:flex-start}.it-template h1{font-size:34px}.it-template .note{text-align:left}
.it-template .stage.dev + .card{box-shadow:-14px 0 70px -18px rgba(118,185,0,.45),inset 1px 0 0 rgba(180,255,120,.25)}
}
@media (prefers-reduced-motion:reduce){.it-template .card{transition:none}}
`;

export default function ItDevopsTemplate({ user, items }: TemplateProps) {
  const [mode, setMode] = useState<Mode>("guide");
  const [lang, setLang] = useState<Lang>("vi");
  const [folded, setFolded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<Mode>(mode);
  const langRef = useRef<Lang>(lang);
  const sceneRef = useRef<{ setMode: (m: Mode, initial?: boolean) => void } | null>(null);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const rows = useMemo<Row[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        kind: kindOf(item),
        label: item.itemName,
        text: item.url,
        href: item.url || undefined,
        iconUrl: item.iconUrl,
      })),
    [items],
  );

  const info = useMemo(() => {
    const find = (k: string) => rows.find((r) => r.kind === k);
    return {
      brand: "#ff7a1a",
      name: user.fullname,
      phone: find("phone")?.href ?? "",
      email: find("mail")?.href ?? "",
      facebook: find("fb")?.href ?? "",
    };
  }, [rows, user.fullname]);

  const infoRef = useRef(info);
  useEffect(() => {
    infoRef.current = info;
  }, [info]);

  const chips = useMemo(() => items.slice(0, 5).map((i) => i.itemName), [items]);

  const avatarSrc = useMemo(() => {
    if (user.avatarUrl) return user.avatarUrl;
    return `data:image/svg+xml;utf8,${encodeURIComponent(AV[mode])}`;
  }, [user.avatarUrl, mode]);

  useEffect(() => {
    let disposed = false;
    let handle: { cleanup: () => void; setMode: (m: Mode, initial?: boolean) => void } | null = null;

    loadThree()
      .then((THREE) => {
        if (disposed || !THREE || !canvasRef.current) return;
        handle = setupScene(THREE, canvasRef.current, cardRef.current, stageRef.current, langRef, modeRef, infoRef);
        sceneRef.current = handle;
        handle.setMode(modeRef.current, true);
      })
      .catch(() => {
        // 3D is decorative; the card panel still works without it.
      });

    return () => {
      disposed = true;
      handle?.cleanup();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    sceneRef.current?.setMode(mode, false);
  }, [mode]);

  const d = MODES[lang][mode];
  const ui = UI[lang];
  const roleLabel = formatRole(user.role?.name);

  return (
    <div className="it-template">
      <style>{CSS}</style>

      <div className={`stage${mode === "dev" ? " dev" : ""}`} ref={stageRef}>
        <div className="sky2" />
        <div className="top" role="tablist" aria-label="Language">
          <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>VI</button>
          <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <div className="switch" role="tablist" aria-label={ui.modeLabel}>
          <button type="button" role="tab" aria-selected={mode === "guide"} className={mode === "guide" ? "on" : ""} onClick={() => setMode("guide")}>{ui.guideTab}</button>
          <button type="button" role="tab" aria-selected={mode === "dev"} className={mode === "dev" ? "on" : ""} onClick={() => setMode("dev")}>{ui.devTab}</button>
        </div>
        <canvas ref={canvasRef} id="gl" aria-label={ui.canvasLabel} />
      </div>

      <main className={`card${folded ? " min" : ""}`} ref={cardRef}>
        <div className="avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt={user.fullname} />
        </div>
        <button className="fold" type="button" aria-label={ui.foldLabel} onClick={() => setFolded((v) => !v)}>
          <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
        </button>
        <div className="scroll">
          <section className="who">
            <h1>{user.fullname}</h1>
            <p className="role">{roleLabel}</p>
            <p className="bio">{d.bio}</p>
            {chips.length > 0 && (
              <div className="chips">
                {chips.map((c) => <span className="chip" key={c}>{c}</span>)}
              </div>
            )}
          </section>

          <nav className="rows">
            {rows.map((row) => {
              const [c1, c2] = COL[row.kind];
              const inner = (
                <>
                  <div className="ico" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                    {row.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.iconUrl} alt={row.label} />
                    ) : (
                      <span aria-hidden>{EMOJI[row.kind]}</span>
                    )}
                  </div>
                  <div><span>{row.label}</span></div>
                </>
              );

              const external = row.href && /^https?:\/\//i.test(row.href);
              return row.href ? (
                <a className="row" key={row.id} href={row.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                  {inner}
                </a>
              ) : (
                <div className="row" key={row.id}>{inner}</div>
              );
            })}
          </nav>

          <p className="note">{NOTE}</p>
        </div>
      </main>
    </div>
  );
}

function setupScene(
  THREE: any,
  canvas: HTMLCanvasElement,
  cardEl: HTMLElement | null,
  stageEl: HTMLDivElement | null,
  langRef: React.MutableRefObject<Lang>,
  modeRef: React.MutableRefObject<Mode>,
  infoRef: React.MutableRefObject<{ brand: string; name: string; phone: string; email: string; facebook: string }>,
): { cleanup: () => void; setMode: (m: Mode, initial?: boolean) => void } {
  const cv = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xa8d8a0, 1.05);
  scene.add(hemi);
  const cDay = new THREE.Color(0xffffff);
  const cNight = new THREE.Color(0x8f9cff);
  const sDay = new THREE.Color(0xfff1d0);
  const sNight = new THREE.Color(0x9fb5ff);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.0);
  sun.position.set(4, 7, 4);
  scene.add(sun);

  const M = (c: any, o: any = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0 }, o));
  const mesh = (geo: any, mat: any, x?: number, y?: number, z?: number, parent?: any) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x || 0, y || 0, z || 0);
    (parent || scene).add(o);
    return o;
  };
  const flat = (c: any) => M(c, { flatShading: true });

  mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.4, 48), M(0x6fcf6a), 0, -0.2, 0);
  const beach = mesh(new THREE.RingGeometry(3.0, 3.4, 48), M(0xf2dfa5, { side: THREE.DoubleSide }), 0, 0.003, 0);
  beach.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(3.4, 3.15, 0.4, 48), M(0x9a6a45), 0, -0.6, 0);
  const rock = mesh(new THREE.ConeGeometry(3.15, 2.4, 9, 1), flat(0x8a7a72), 0, -2.0, 0);
  rock.rotation.x = Math.PI;
  const path = mesh(new THREE.RingGeometry(2.1, 2.5, 64), M(0xe9cf8e, { side: THREE.DoubleSide }), 0, 0.006, 0);
  path.rotation.x = -Math.PI / 2;
  mesh(new THREE.ConeGeometry(1.05, 2.0, 7), flat(0x77906a), 0, 1.0, 0);
  mesh(new THREE.ConeGeometry(0.38, 0.7, 7), flat(0xffffff), 0, 1.78, 0);
  mesh(new THREE.ConeGeometry(0.7, 1.2, 7), flat(0x86a276), 0.85, 0.6, -0.35);
  mesh(new THREE.ConeGeometry(0.55, 0.9, 7), flat(0x6f8a62), -0.8, 0.45, 0.45);

  function palm(x: number, z: number, s: number, lean: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    g.rotation.y = x * 3.1;
    scene.add(g);
    const tx = 1.2 * Math.sin(lean);
    const ty = 1.2 * Math.cos(lean);
    mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.2, 7), M(0x8a5a3c), tx / 2, ty / 2, 0, g).rotation.z = -lean;
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      const lf = mesh(new THREE.SphereGeometry(0.34, 8, 6), flat(k % 2 ? 0x2fa24a : 0x3cb85a), tx + Math.cos(a) * 0.3, ty, Math.sin(a) * 0.3, g);
      lf.scale.set(1, 0.1, 0.3);
      lf.rotation.set(0, -a, -0.35);
    }
    mesh(new THREE.SphereGeometry(0.07, 8, 8), M(0x6a4a2a), tx, ty - 0.05, 0, g);
  }
  [[2.9, 0.3, 1, 0.3], [-2.8, -0.6, 1.1, -0.3], [1.4, 2.7, 0.9, 0.25], [-1.9, 2.3, 1, -0.25], [0.3, -3.0, 1.05, 0.2], [2.2, -2.2, 0.9, 0.3]].forEach((p: any) => palm(p[0], p[1], p[2], p[3]));

  function pine(x: number, z: number, s: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 6), M(0x7a5236), 0, 0.15, 0, g);
    mesh(new THREE.ConeGeometry(0.3, 0.6, 7), flat(0x2f8a4e), 0, 0.55, 0, g);
    mesh(new THREE.ConeGeometry(0.22, 0.5, 7), flat(0x3a9c5a), 0, 0.9, 0, g);
  }
  [[-1.2, -1.5, 1], [-1.7, -0.9, 0.8], [1.7, -1.2, 0.9], [-2.3, 1.1, 0.8]].forEach((p: any) => pine(p[0], p[1], p[2]));
  const tent = mesh(new THREE.ConeGeometry(0.34, 0.5, 4), flat(0xff6b4a), -1.0, 0.25, 3.0);
  tent.rotation.y = Math.PI / 4;

  const clouds: any[] = [];
  [[5.2, 2.3, 0.0, 0.18], [5.8, 3.4, 2.1, 0.12], [4.6, 1.4, 4.0, -0.15]].forEach(([r, y, a0, sp]: any) => {
    const g = new THREE.Group();
    scene.add(g);
    [[0, 0, 0, 0.55], [0.55, -0.1, 0.1, 0.42], [-0.55, -0.1, 0, 0.4], [0.15, 0.2, 0, 0.4]].forEach(([x, yy, z, s]: any) =>
      mesh(new THREE.SphereGeometry(s, 12, 10), M(0xffffff, { roughness: 1 }), x, yy, z, g),
    );
    g.userData = { r, y, a: a0, sp };
    clouds.push(g);
  });
  const sunBall = mesh(new THREE.SphereGeometry(0.55, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffe27a }), 4.2, 4.2, -4);

  const plane = new THREE.Group();
  const pin = new THREE.Group();
  plane.add(pin);
  scene.add(plane);
  mesh(new THREE.ConeGeometry(0.07, 0.55, 8), M(0xffffff), 0, 0, 0, pin).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.78, 0.02, 0.18), M(0xffffff), 0, 0, -0.05, pin);
  mesh(new THREE.BoxGeometry(0.22, 0.02, 0.1), M(0xff6b4a), 0, 0, -0.24, pin);
  mesh(new THREE.BoxGeometry(0.02, 0.14, 0.12), M(0xff6b4a), 0, 0.06, -0.24, pin);
  pin.rotation.z = 0.3;

  const devScene = new THREE.Group();
  devScene.visible = false;
  scene.add(devScene);
  const tourOnly = [tent, plane];
  const leds: any[] = [];
  const pipe: any[] = [];
  const tourParts: any[] = [];
  const devParts: any[] = [];

  function rack(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = Math.atan2(-x, -z);
    devScene.add(g);
    mesh(new THREE.BoxGeometry(0.5, 1.1, 0.42), M(0x20243a, { roughness: 0.5, metalness: 0.4 }), 0, 0.55, 0, g);
    for (let i = 0; i < 5; i++) {
      mesh(new THREE.BoxGeometry(0.42, 0.1, 0.02), M(0x3a4166, { roughness: 0.4, metalness: 0.5 }), 0, 0.2 + i * 0.18, 0.215, g);
      const led = mesh(
        new THREE.BoxGeometry(0.035, 0.035, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: i % 2 ? 0x35ffb0 : 0x35d6ff, emissiveIntensity: 1 }),
        0.15,
        0.2 + i * 0.18,
        0.23,
        g,
      );
      led.userData.ph = i * 1.3 + x;
      leds.push(led);
    }
  }
  rack(2.95, -0.9);
  rack(2.7, -1.6);
  rack(-2.9, -1.4);
  [[0x1fb5c9, 0.15, 0], [0xff8a4a, 0.45, 0.2], [0x7a5cff, 0.75, -0.15]].forEach(([c, y, r]: any) => {
    const b = mesh(new THREE.BoxGeometry(0.8, 0.3, 0.34), M(c, { roughness: 0.5 }), -2.9, y, 1.2, devScene);
    b.rotation.y = r + 0.3;
  });
  mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8), M(0xcfd6e6), 1.9, 0.3, 2.5, devScene);
  const dish = new THREE.Group();
  dish.position.set(1.9, 0.62, 2.5);
  devScene.add(dish);
  mesh(new THREE.ConeGeometry(0.28, 0.18, 20, 1, true), M(0xeaf0ff, { side: THREE.DoubleSide, metalness: 0.3 }), 0, 0, 0.1, dish).rotation.x = Math.PI / 2.4;
  const ringLine = mesh(new THREE.TorusGeometry(3.1, 0.012, 6, 80), new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.5 }), 0, 1.0, 0, devScene);
  ringLine.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++)
    pipe.push(
      mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, emissive: [0x35ffb0, 0x35d6ff, 0x7a5cff][i % 3], emissiveIntensity: 0.8 }),
        0,
        0,
        0,
        devScene,
      ),
    );

  const sats: any[] = [];
  const evCars: any[] = [];
  const gold = M(0xd9b24a, { roughness: 0.35, metalness: 0.8 });
  const panelM = M(0x1f3d9a, { roughness: 0.3, metalness: 0.7, emissive: 0x0a1f66, emissiveIntensity: 0.5 });
  const silver = M(0xdfe6f2, { roughness: 0.3, metalness: 0.7 });
  function satellite() {
    const g = new THREE.Group();
    g.scale.setScalar(0.85);
    devScene.add(g);
    mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), gold, 0, 0, 0, g);
    [-1, 1].forEach((s) => {
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), silver, s * 0.2, 0, 0, g).rotation.z = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.5, 0.012, 0.26), panelM, s * 0.55, 0, 0, g);
      for (let k = 1; k < 4; k++) mesh(new THREE.BoxGeometry(0.005, 0.014, 0.26), silver, s * (0.33 + k * 0.12), 0, 0, g);
    });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), silver, 0, 0.15, 0, g);
    mesh(new THREE.ConeGeometry(0.09, 0.06, 16, 1, true), M(0xeaf0ff, { side: THREE.DoubleSide, metalness: 0.4 }), 0, 0.2, 0, g);
    g.userData.led = mesh(new THREE.SphereGeometry(0.024, 8, 8), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff3b3b, emissiveIntensity: 1 }), 0, -0.12, 0.15, g);
    return g;
  }
  [[4.6, 0.45, 0, 0.5], [5.0, -0.35, 2.1, 0.38], [4.3, 0.6, 4.2, 0.62]].forEach(([r, tilt, ph, sp]: any) => {
    const s = satellite();
    s.userData.o = { r, tilt, ph, sp };
    sats.push(s);
  });
  function evCar(color: any) {
    const g = new THREE.Group();
    g.scale.setScalar(1.5);
    devScene.add(g);
    const body = M(color, { roughness: 0.25, metalness: 0.6 });
    const lamp = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
    const cyan = new THREE.MeshStandardMaterial({ color: 0x35d6ff, emissive: 0x35d6ff, emissiveIntensity: 1 });
    mesh(new THREE.BoxGeometry(0.3, 0.09, 0.62), body, 0, 0, 0, g);
    mesh(new THREE.BoxGeometry(0.24, 0.09, 0.26), M(0x9fe8ff, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8 }), 0, 0.09, -0.04, g);
    mesh(new THREE.BoxGeometry(0.31, 0.012, 0.46), new THREE.MeshStandardMaterial({ color: 0x76b900, emissive: 0x76b900, emissiveIntensity: 0.8 }), 0, 0.0, 0, g);
    [-1, 1].forEach((s) => {
      mesh(new THREE.BoxGeometry(0.07, 0.03, 0.02), lamp, s * 0.09, 0.0, 0.315, g);
      mesh(new THREE.BoxGeometry(0.07, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2a2a, emissiveIntensity: 1 }), s * 0.09, 0.0, -0.315, g);
      [-1, 1].forEach((q) => mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14), cyan, s * 0.13, -0.065, q * 0.2, g));
    });
    const gl = mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshBasicMaterial({ color: 0x35d6ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -0.1, 0, g);
    gl.rotation.x = -Math.PI / 2;
    const tr = mesh(new THREE.ConeGeometry(0.07, 0.5, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, 0, -0.56, g);
    tr.rotation.x = -Math.PI / 2;
    g.userData.glow = gl;
    return g;
  }
  [[0x2ee6c5, 4.1, 2.4, 0.42, 1, 0], [0xffffff, 4.5, 3.0, 0.33, -1, 2.2], [0xff8a4a, 3.9, 3.5, 0.5, 1, 4.1]].forEach(([c, R, y, sp, dir, ph]: any) => {
    const e = evCar(c);
    e.userData.o = { R, y, sp, dir, ph };
    evCars.push(e);
  });

  const guide = new THREE.Group();
  guide.scale.setScalar(1.55);
  scene.add(guide);
  const skin = M(0xf2c9a5);
  const shirt = M(0xff6b3d);
  const pants = M(0xc9a96a);
  const dark = M(0x1b1410, { roughness: 0.4 });
  const yel = M(0xffc83d);
  const legs = [-1, 1].map((s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.07, 0.38, 0);
    guide.add(g);
    mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), pants, 0, -0.19, 0, g);
    mesh(new THREE.SphereGeometry(0.07, 10, 8), dark, 0, -0.38, 0.03, g).scale.set(1, 0.6, 1.4);
    return g;
  });
  mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 16), shirt, 0, 0.56, 0, guide);
  tourParts.push(mesh(new THREE.BoxGeometry(0.2, 0.26, 0.1), M(0x2f8a4e), 0, 0.58, -0.16, guide));
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), skin, 0, 0.76, 0, guide);
  mesh(new THREE.SphereGeometry(0.13, 20, 16), skin, 0, 0.88, 0, guide);
  tourParts.push(mesh(new THREE.SphereGeometry(0.125, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), yel, 0, 0.92, 0, guide));
  tourParts.push(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.015, 24), yel, 0, 0.93, 0.02, guide));
  [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.018, 8, 8), dark, s * 0.05, 0.89, 0.12, guide));
  function garm(s: number) {
    const g = new THREE.Group();
    g.position.set(s * 0.2, 0.7, 0);
    guide.add(g);
    mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.28, 10), shirt, 0, -0.14, 0, g);
    mesh(new THREE.SphereGeometry(0.05, 10, 10), skin, 0, -0.3, 0, g);
    return g;
  }
  const gL = garm(-1);
  const gR = garm(1);
  const pole = new THREE.Group();
  pole.position.set(0, -0.3, 0);
  gR.add(pole);
  tourParts.push(pole);
  mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.75, 6), M(0x6a4a2a), 0, 0.3, 0, pole);
  const flag = mesh(new THREE.PlaneGeometry(0.3, 0.2), M(0xe5483a, { side: THREE.DoubleSide, roughness: 0.7 }), 0.15, 0.55, 0, pole);
  const shadow = mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }), 0, 0.012, 0);
  shadow.rotation.x = -Math.PI / 2;
  const hood = M(0x4a3bb8, { roughness: 0.9 });
  const hairD = M(0x1b1420, { roughness: 0.9 });
  const neon = new THREE.MeshStandardMaterial({ color: 0x35d6ff, emissive: 0x1fb0d8, emissiveIntensity: 0.9 });
  const alu = M(0x8a93a8, { metalness: 0.6, roughness: 0.4 });
  const hd = mesh(new THREE.SphereGeometry(0.15, 16, 12), hood, 0, 0.8, -0.09, guide);
  hd.scale.set(1, 0.7, 0.9);
  devParts.push(hd);
  devParts.push(mesh(new THREE.SphereGeometry(0.137, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairD, 0, 0.885, -0.004, guide));
  devParts.push(mesh(new THREE.TorusGeometry(0.15, 0.016, 8, 20, Math.PI), dark, 0, 0.88, 0, guide));
  [-1, 1].forEach((s) => {
    devParts.push(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), dark, s * 0.15, 0.88, 0, guide).rotateZ(Math.PI / 2));
    devParts.push(mesh(new THREE.TorusGeometry(0.036, 0.007, 6, 16), dark, s * 0.052, 0.89, 0.128, guide));
  });
  const lap = new THREE.Group();
  lap.position.set(0, -0.34, 0.08);
  gR.add(lap);
  devParts.push(lap);
  mesh(new THREE.BoxGeometry(0.26, 0.014, 0.17), alu, 0, 0, 0, lap);
  mesh(new THREE.BoxGeometry(0.26, 0.17, 0.012), alu, 0, 0.085, -0.085, lap).rotation.x = -0.25;
  mesh(new THREE.PlaneGeometry(0.23, 0.14), neon, 0, 0.085, -0.077, lap).rotation.x = -0.25;
  devParts.forEach((o) => (o.visible = false));

  const JS = 2.6;
  const jet = new THREE.Group();
  jet.scale.setScalar(JS);
  jet.visible = false;
  scene.add(jet);
  const gdark = M(0x1c2026, { roughness: 0.5, metalness: 0.4 });
  const tire = M(0x0d0f12, { roughness: 0.9 });
  const green = M(0x76b900, { roughness: 0.35, metalness: 0.5 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x76b900, emissive: 0x76b900, emissiveIntensity: 1 });
  const tipM = new THREE.MeshStandardMaterial({ color: 0x76b900, emissive: 0x76b900, emissiveIntensity: 1 });
  const wheels: any[] = [];
  const lights: any[] = [];
  let wheelRot = 0;
  mesh(new THREE.BoxGeometry(0.46, 0.07, 0.36), gdark, 0, 0.11, 0, jet);
  mesh(new THREE.BoxGeometry(0.4, 0.025, 0.3), gdark, 0, 0.2, 0, jet);
  mesh(new THREE.BoxGeometry(0.4, 0.008, 0.02), glow, 0, 0.2135, 0.15, jet);
  mesh(new THREE.BoxGeometry(0.2, 0.03, 0.15), M(0x0f1216, { roughness: 0.4 }), 0, 0.235, -0.02, jet);
  mesh(new THREE.BoxGeometry(0.13, 0.035, 0.1), green, 0, 0.27, -0.02, jet);
  for (let i = -2; i <= 2; i++) mesh(new THREE.BoxGeometry(0.01, 0.03, 0.1), green, i * 0.025, 0.3, -0.02, jet);
  mesh(new THREE.SphereGeometry(0.04, 12, 12), gdark, 0, 0.04, 0.15, jet);
  mesh(new THREE.SphereGeometry(0.04, 12, 12), gdark, 0, 0.04, -0.15, jet);
  [-1, 1].forEach((s) => {
    const w = new THREE.Group();
    w.position.set(s * 0.26, 0.1, 0);
    jet.add(w);
    wheels.push(w);
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 24), tire, 0, 0, 0, w).rotation.z = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.075, 16), green, 0, 0, 0, w).rotation.z = Math.PI / 2;
    for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(0.078, 0.012, 0.17), gdark, 0, 0, 0, w).rotation.x = (k * Math.PI) / 4;
    lights.push(mesh(new THREE.SphereGeometry(0.018, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfffa0, emissiveIntensity: 0.8 }), s * 0.17, 0.14, 0.185, jet));
  });
  const cam3 = new THREE.Group();
  cam3.position.set(0, 0.3, 0.14);
  jet.add(cam3);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), gdark, 0, -0.03, 0, cam3);
  mesh(new THREE.BoxGeometry(0.09, 0.055, 0.05), gdark, 0, 0.025, 0, cam3);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x2aa8ff, emissiveIntensity: 0.9 }), 0, 0.025, 0.03, cam3).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6), gdark, -0.17, 0.33, -0.14, jet);
  mesh(new THREE.SphereGeometry(0.014, 8, 8), tipM, -0.17, 0.43, -0.14, jet);
  mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ color: 0x76b900, transparent: true, opacity: 0.22 }), 0, 0.012, 0, jet).rotation.x = -Math.PI / 2;

  const RC = 2.3;
  const AB = 3.0;
  const SG = 0.45;
  const NP = 720;
  const route: any[] = [];
  const cum: number[] = [0];
  let spurPhi = 0;
  let tipS = 0;
  let routeS = 0;
  let pauseT = 0;
  let jetYaw = 0;
  let ribbon: any = null;
  let routeLine: any = null;
  const rAt = (phi: number, p0: number) => {
    const d = Math.atan2(Math.sin(phi - p0), Math.cos(phi - p0));
    return RC + AB * Math.exp(-(d / SG) * (d / SG));
  };
  function setSpur(p0: number) {
    if (route.length && Math.abs(p0 - spurPhi) < 1e-3) return;
    spurPhi = p0;
    route.length = 0;
    cum.length = 1;
    let maxR = 0;
    let tipI = 0;
    for (let i = 0; i <= NP; i++) {
      const phi = (i / NP) * Math.PI * 2;
      const r = rAt(phi, p0);
      route.push([r * Math.cos(phi), r * Math.sin(phi)]);
      if (r > maxR) {
        maxR = r;
        tipI = i;
      }
    }
    for (let i = 1; i <= NP; i++) cum.push(cum[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
    tipS = cum[tipI];
    routeS = 0;
    if (ribbon) {
      devScene.remove(ribbon);
      ribbon.geometry.dispose();
    }
    if (routeLine) {
      devScene.remove(routeLine);
      routeLine.geometry.dispose();
    }
    const pos: number[] = [];
    for (let i = 0; i < NP; i++) {
      const a = route[i];
      const b = route[i + 1];
      const ra = Math.hypot(a[0], a[1]);
      const rb = Math.hypot(b[0], b[1]);
      if (ra > 3.3 && rb > 3.3) {
        const ia = [(a[0] * 3.3) / ra, (a[1] * 3.3) / ra];
        const ib = [(b[0] * 3.3) / rb, (b[1] * 3.3) / rb];
        pos.push(ia[0], 0.02, ia[1], a[0], 0.02, a[1], b[0], 0.02, b[1], ia[0], 0.02, ia[1], b[0], 0.02, b[1], ib[0], 0.02, ib[1]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    ribbon = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x76b900, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    devScene.add(ribbon);
    routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route.map((p) => new THREE.Vector3(p[0], 0.025, p[1]))),
      new THREE.LineBasicMaterial({ color: 0x9bff2a, transparent: true, opacity: 0.55 }),
    );
    devScene.add(routeLine);
  }
  function routeAt(s: number) {
    const L = cum[NP];
    s = ((s % L) + L) % L;
    let lo = 0;
    let hi = NP;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const a = route[lo];
    const b = route[lo + 1];
    const k = (s - cum[lo]) / Math.max(1e-6, cum[lo + 1] - cum[lo]);
    return { x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  }
  setSpur(Math.PI / 2);

  function sprite(draw: (g: CanvasRenderingContext2D) => void, size: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    if (x) draw(x);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
    (s as any).cvs = c;
    (s as any).tex = t;
    s.scale.set(size, size, 1);
    scene.add(s);
    return s;
  }
  const props = [
    ["🗺️", -3.0, 2.9, -1.2],
    ["🧭", 3.0, 2.9, -1.0],
    ["📸", -3.3, 0.9, 1.8],
    ["🎒", 3.3, 0.9, 1.6],
  ].map(([em, x, y, z]: any, i: number) => {
    const s = sprite((g) => {
      g.fillStyle = "rgba(255,255,255,.8)";
      g.beginPath();
      g.arc(64, 64, 58, 0, 7);
      g.fill();
      g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(em as string, 64, 70);
    }, 0.9);
    s.userData = { x, y, z, ph: i * 1.7, pulse: 0 };
    return s;
  });

  const contactHrefs: Record<string, string> = {
    phone: infoRef.current.phone,
    mail: infoRef.current.email,
    fb: infoRef.current.facebook,
  };
  const contactKinds = (["phone", "mail", "fb"] as const).filter((k) => contactHrefs[k]);
  const contactItems: any[] = [];
  contactKinds.forEach((k, i) => {
    const s = sprite((x) => {
      const g = x.createLinearGradient(0, 0, 128, 128);
      g.addColorStop(0, COL[k][0]);
      g.addColorStop(1, COL[k][1]);
      x.fillStyle = g;
      x.beginPath();
      x.arc(64, 64, 56, 0, 7);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.85)";
      x.lineWidth = 4;
      x.stroke();
      x.translate(32, 32);
      x.scale(2.7, 2.7);
      x.fillStyle = "#fff";
      x.fill(new Path2D(PATHS[k]));
    }, 0.85);
    s.userData = { href: contactHrefs[k], a: (i * Math.PI * 2) / contactKinds.length + 0.6 };
    contactItems.push(s);
  });

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  (stageEl || cv.parentNode)?.appendChild(bubble);
  let hideT: ReturnType<typeof setTimeout> | undefined;
  let msgI = 0;
  let tipI = 0;
  let wave = 0;
  let camD = 10.2;
  let camAz = 0;
  let camTarget = 0;
  let down: { x: number; y: number } | null = null;
  let ang = 0;
  let phase = 0;
  function say(t: string) {
    bubble.textContent = t;
    bubble.classList.add("on");
    if (hideT) clearTimeout(hideT);
    hideT = setTimeout(() => bubble.classList.remove("on"), 3400);
  }
  const ray = new THREE.Raycaster();
  const m = new THREE.Vector2();
  const tmp = new THREE.Vector3();
  function setRay(e: PointerEvent) {
    const r = cv.getBoundingClientRect();
    m.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(m, cam);
  }
  const pickItem = (e: PointerEvent) => {
    setRay(e);
    return ray.intersectObjects(contactItems)[0];
  };
  const pickProp = (e: PointerEvent) => {
    setRay(e);
    return ray.intersectObjects(props)[0];
  };
  function near(obj: any, dy: number, e: PointerEvent, rad: number) {
    const r = cv.getBoundingClientRect();
    obj.getWorldPosition(tmp);
    tmp.y += dy;
    const p = tmp.project(cam);
    return Math.hypot(e.clientX - (r.left + (p.x * 0.5 + 0.5) * r.width), e.clientY - (r.top + (-p.y * 0.5 + 0.5) * r.height)) < rad;
  }
  const onPointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const hit = pickItem(e);
    const prop = !hit && pickProp(e);
    if (hit) {
      const u = hit.object.userData.href;
      if (u) openHref(u);
    } else if (prop) {
      prop.object.userData.pulse = 1;
      const T = MODES[langRef.current][modeRef.current].tips;
      say(T[tipI++ % T.length]);
    } else if (near(modeRef.current === "dev" ? jet : guide, 0.8, e, 55)) {
      wave = 2.6;
      const G = MODES[langRef.current][modeRef.current].msgs(infoRef.current.name);
      say(G[msgI++ % G.length]);
    } else if (modeRef.current === "guide" && near(plane, 0, e, 45)) {
      say(UI[langRef.current].plane);
    } else if (modeRef.current === "dev" && sats.concat(evCars).some((o) => near(o, 0, e, 42))) {
      say(Math.random() < 0.5 ? UI[langRef.current].satellite : UI[langRef.current].evCar);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor =
      pickItem(e) || pickProp(e) || near(modeRef.current === "dev" ? jet : guide, 0.8, e, 55) || near(plane, 0, e, 45) ? "pointer" : "default";
    if (down) camTarget = Math.max(-1.4, Math.min(1.4, (e.clientX - down.x) * 0.01));
  };
  const resetPointer = () => {
    down = null;
    camTarget = 0;
  };
  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("pointerup", onPointerUp);
  cv.addEventListener("pointermove", onPointerMove);
  cv.addEventListener("pointerup", resetPointer);
  cv.addEventListener("pointercancel", resetPointer);
  cv.addEventListener("pointerleave", resetPointer);
  setTimeout(() => say(UI[langRef.current].hint), 600);

  let mode: Mode = "guide";
  let modeT = 0;
  let modeTarget = 0;
  let popT = 0;
  function drawEmoji(s: any, em: string) {
    const g = s.cvs.getContext("2d");
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = "rgba(255,255,255,.8)";
    g.beginPath();
    g.arc(64, 64, 58, 0, 7);
    g.fill();
    g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(em, 64, 70);
    s.tex.needsUpdate = true;
  }
  function setMode(m: Mode, initial?: boolean) {
    mode = m;
    modeTarget = m === "dev" ? 1 : 0;
    if (initial) modeT = modeTarget;
    else popT = 1;
    const D = MODES[langRef.current][m];
    shirt.color.set(m === "dev" ? 0x5b4bd6 : 0xff6b3d);
    tourParts.forEach((o) => (o.visible = m === "guide"));
    devParts.forEach((o) => (o.visible = m === "dev"));
    guide.visible = m === "guide";
    jet.visible = m === "dev";
    tourOnly.forEach((o) => (o.visible = m === "guide"));
    devScene.visible = m === "dev";
    props.forEach((s, i) => drawEmoji(s, D.props[i]));
    sunBall.material.color.set(m === "dev" ? 0xdfe8ff : 0xffe27a);
    if (!initial) say(D.switchMsg);
  }

  function resize() {
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cr = cardEl ? cardEl.getBoundingClientRect() : { width: 0, top: h, height: 0 };
    const wide = window.innerWidth >= 860;
    const visH = wide ? h : Math.max(160, cr.top - 40);
    const effW = wide ? w - cr.width * 0.5 : w;
    const effH = wide ? h : visH + (h - visH) * 0.45;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    camD = Math.max(9.5, (10.2 * h) / Math.min(effW, effH));
    cam.setViewOffset(w, h, wide ? cr.width * 0.25 : 0, wide ? 0 : (h - visH) * 0.25, w, h);
    setSpur(wide ? 0 : Math.PI / 2);
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  if (cardEl) ro.observe(cardEl);
  resize();

  const clock = new THREE.Clock();
  const RP = 2.3;
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    wave = Math.max(0, wave - dt);
    const walking = wave <= 0;
    if (walking) {
      ang += dt * 0.42;
      phase += dt * 7;
    }
    guide.position.set(Math.cos(ang) * RP, walking ? Math.abs(Math.sin(phase)) * 0.03 : 0, Math.sin(ang) * RP);
    const want = walking
      ? Math.atan2(-Math.sin(ang), Math.cos(ang))
      : Math.atan2(cam.position.x - guide.position.x, cam.position.z - guide.position.z);
    let d = want - guide.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    guide.rotation.y += d * Math.min(1, dt * 6);
    const sw = walking ? Math.sin(phase) : 0;
    legs[0].rotation.x += (sw * 0.7 - legs[0].rotation.x) * Math.min(1, dt * 14);
    legs[1].rotation.x += (-sw * 0.7 - legs[1].rotation.x) * Math.min(1, dt * 14);
    gL.rotation.x += (-sw * 0.6 - gL.rotation.x) * Math.min(1, dt * 14);
    const tz = walking
      ? (mode === "dev" ? 0.5 : 0.35) + Math.sin(phase * 2) * 0.03
      : mode === "dev"
        ? 1.1 + Math.sin(t * 9) * 0.12
        : 2.3 + Math.sin(t * 11) * 0.3;
    gR.rotation.z += (tz - gR.rotation.z) * Math.min(1, dt * 10);
    flag.rotation.y = Math.sin(t * 6) * 0.35;
    shadow.position.set(guide.position.x, 0.012, guide.position.z);
    if (jet.visible) {
      const stopped = wave > 0 || pauseT > 0;
      pauseT = Math.max(0, pauseT - dt);
      if (!stopped) {
        const prev = routeS;
        const L = cum[NP];
        routeS += dt * 0.95;
        wheelRot += dt * 3.65;
        if (prev % L < tipS && routeS % L >= tipS) {
          pauseT = 1.8;
          say(UI[langRef.current].robot);
        }
      }
      const rp = routeAt(routeS);
      jet.position.set(rp.x, 0, rp.z);
      const want2 = stopped ? Math.atan2(cam.position.x - jet.position.x, cam.position.z - jet.position.z) : rp.yaw;
      let dyaw = want2 - jetYaw;
      dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      jetYaw += dyaw * Math.min(1, dt * 6);
      jet.rotation.y = jetYaw;
      wheels.forEach((w) => (w.rotation.x = wheelRot));
      const att = stopped;
      lights.forEach((l) => (l.material.emissiveIntensity = att ? (Math.sin(t * 16) > 0 ? 2.2 : 0.3) : 0.8));
      cam3.rotation.y = att ? Math.sin(t * 3) * 0.5 : Math.sin(t * 0.8) * 0.7;
      tipM.emissiveIntensity = 0.5 + (Math.sin(t * 4) > 0 ? 1 : 0);
      jet.scale.setScalar(JS * (1 + Math.sin(popT * Math.PI) * 0.25));
      jet.position.y = att ? Math.abs(Math.sin(t * 10)) * 0.02 : 0;
      shadow.position.set(jet.position.x, 0.012, jet.position.z);
      shadow.scale.setScalar(2.2);
    } else shadow.scale.setScalar(1);
    clouds.forEach((g) => {
      const u = g.userData;
      u.a += dt * u.sp;
      g.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.6 + u.a) * 0.1, (Math.sin(u.a) * u.r * 0.7) - 1);
    });
    const pa = t * 0.45;
    plane.position.set(Math.cos(pa) * 4.4, 3.0 + Math.sin(t * 1.1) * 0.2, Math.sin(pa) * 4.4);
    plane.rotation.y = Math.atan2(-Math.sin(pa), Math.cos(pa));
    props.forEach((s) => {
      const u = s.userData;
      u.pulse = Math.max(0, u.pulse - dt * 1.5);
      s.position.set(u.x, u.y + Math.sin(t * 1.4 + u.ph) * 0.12, u.z);
      const k = 0.9 * (1 + Math.sin(u.pulse * Math.PI) * 0.45);
      s.scale.set(k, k, 1);
    });
    contactItems.forEach((s) => {
      const a = s.userData.a - t * 0.4;
      s.position.set(Math.cos(a) * 3.8, 1.9 + Math.sin(a * 1.3) * 0.4 + Math.sin(t * 1.3 + a) * 0.08, Math.sin(a) * 3.0);
    });
    modeT += (modeTarget - modeT) * Math.min(1, dt * 3);
    hemi.intensity = 1.05 - 0.3 * modeT;
    hemi.color.lerpColors(cDay, cNight, modeT);
    sun.intensity = 1.0 - 0.35 * modeT;
    sun.color.lerpColors(sDay, sNight, modeT);
    if (devScene.visible) {
      leds.forEach((l) => (l.material.emissiveIntensity = 0.3 + (Math.sin(t * 5 + l.userData.ph) > 0 ? 1.2 : 0)));
      dish.rotation.y = Math.sin(t * 0.5) * 0.8;
      sats.forEach((s) => {
        const o = s.userData.o;
        const a = o.ph + t * o.sp;
        s.position.set(Math.cos(a) * o.r, 2.6 + Math.sin(a) * o.r * Math.sin(o.tilt) * 0.5, Math.sin(a) * o.r * Math.cos(o.tilt));
        s.rotation.y = a * 0.5;
        s.userData.led.material.emissiveIntensity = Math.sin(t * 5 + o.ph) > 0.4 ? 2 : 0.2;
      });
      evCars.forEach((c) => {
        const o = c.userData.o;
        const a = o.ph + o.dir * t * o.sp;
        c.position.set(Math.cos(a) * o.R, o.y + Math.sin(t * 1.7 + o.ph) * 0.1, Math.sin(a) * o.R);
        c.rotation.y = o.dir > 0 ? Math.atan2(-Math.sin(a), Math.cos(a)) : Math.atan2(Math.sin(a), -Math.cos(a));
        c.rotation.z = -o.dir * 0.12;
        c.userData.glow.material.opacity = 0.35 + Math.sin(t * 6 + o.ph) * 0.1;
      });
      pipe.forEach((p, i) => {
        const a = t * 0.6 + (i * Math.PI) / 3;
        p.position.set(Math.cos(a) * 3.1, 1.0 + Math.sin(t * 2 + i) * 0.08, Math.sin(a) * 3.1);
        p.rotation.y = t * 2;
        p.material.emissiveIntensity = 0.4 + (Math.sin(t * 3 - i) > 0.5 ? 1.2 : 0);
      });
    }
    popT = Math.max(0, popT - dt * 2.2);
    guide.scale.setScalar(1.55 * (1 + Math.sin(popT * Math.PI) * 0.25));
    camAz += (camTarget - camAz) * Math.min(1, dt * 5);
    const az = camAz + Math.sin(t * 0.25) * 0.08;
    cam.position.set(Math.sin(az) * camD, (3.6 * camD) / 10.2, Math.cos(az) * camD);
    cam.lookAt(0, 0.2, 0);
    renderer.render(scene, cam);
  }
  loop();

  return {
    setMode,
    cleanup: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (hideT) clearTimeout(hideT);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointerup", onPointerUp);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerup", resetPointer);
      cv.removeEventListener("pointercancel", resetPointer);
      cv.removeEventListener("pointerleave", resetPointer);
      bubble.remove();
      renderer.dispose();
    },
  };
}
