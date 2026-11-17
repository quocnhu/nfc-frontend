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

const TECH_MSGS: Record<Lang, (n: string) => string[]> = {
  vi: (n: string) => [
    `Tôi tên là ${n}.`,
    "Tôi đang kiểm tra server để đảm bảo hoạt động 24/7.",
    "Nếu có vấn đề gì về hạ tầng và phần mềm cứ liên hệ tôi nhé.",
  ],
  en: (n: string) => [
    `My name is ${n}.`,
    "I'm checking the servers to make sure everything runs 24/7.",
    "If you have any infrastructure or software issues, just contact me.",
  ],
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
.it-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid #ff9f1c;background:#fff;box-shadow:0 0 25px 8px color-mix(in srgb,var(--sun) 35%,transparent),0 0 60px 15px color-mix(in srgb,var(--sun) 15%,transparent),0 8px 22px -8px rgba(0,0,0,.5);animation:it-avatar-pulse 3s ease-in-out infinite;will-change:transform}
.it-template .avatar svg,.it-template .avatar img{position:relative;z-index:1;width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.it-template .avatar .halo{position:absolute;inset:0;border-radius:50%;border:2px solid color-mix(in srgb,var(--sun) 60%,transparent);animation:it-avatar-ripple 2.4s ease-out infinite;pointer-events:none}
.it-template .avatar .halo:nth-child(2){animation-delay:.8s}
.it-template .avatar .halo:nth-child(3){animation-delay:1.6s}
@keyframes it-avatar-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes it-avatar-ripple{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.6);opacity:0}}
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
.it-template .nfc{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;font-size:11.5px;line-height:1.5;color:var(--muted)}
.it-template .nfc i{flex:none;width:8px;height:8px;border-radius:50%;background:var(--sun);animation:it-nfc-pulse 2s infinite}
@keyframes it-nfc-pulse{0%{box-shadow:0 0 0 0 var(--sun)}70%,100%{box-shadow:0 0 0 10px transparent}}
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
.it-template .avatar{position:relative;top:auto;left:auto;margin:30px auto 0}
.it-template .scroll{padding:14px 24px 28px;flex:1}
.it-template .fold{display:none}
.it-template .switch,.it-template .bubble{left:calc((100% - var(--panel))/2)}
.it-template .who{text-align:center}.it-template .bio{margin-left:auto}.it-template .chips{justify-content:center}.it-template h1{font-size:34px}
.it-template .stage.dev + .card{box-shadow:-14px 0 70px -18px rgba(118,185,0,.45),inset 1px 0 0 rgba(180,255,120,.25)}
}
@media (prefers-reduced-motion:reduce){.it-template .card{transition:none}.it-template .avatar,.it-template .avatar .halo,.it-template .nfc i{animation:none}}
`;

interface ITDevopTourismTemplateProps extends TemplateProps {
  initialMode?: Mode;
  hideModeSwitch?: boolean;
}

export default function ITDevopTourismTemplate({
  user,
  items,
  initialMode = "guide",
  hideModeSwitch = false,
}: ITDevopTourismTemplateProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
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
        {!hideModeSwitch && (
          <div className="switch" role="tablist" aria-label={ui.modeLabel}>
            <button type="button" role="tab" aria-selected={mode === "guide"} className={mode === "guide" ? "on" : ""} onClick={() => setMode("guide")}>{ui.guideTab}</button>
            <button type="button" role="tab" aria-selected={mode === "dev"} className={mode === "dev" ? "on" : ""} onClick={() => setMode("dev")}>{ui.devTab}</button>
          </div>
        )}
        <canvas ref={canvasRef} id="gl" aria-label={ui.canvasLabel} />
      </div>

      <main className={`card${folded ? " min" : ""}`} ref={cardRef}>
        <div className="avatar">
          <span className="halo" aria-hidden="true" />
          <span className="halo" aria-hidden="true" />
          <span className="halo" aria-hidden="true" />
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

          <p className="nfc"><i /><span>{NOTE}</span></p>
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
  const mountain = new THREE.Group();
  scene.add(mountain);
  mesh(new THREE.ConeGeometry(1.05, 2.0, 7), flat(0x77906a), 0, 1.0, 0, mountain);
  mesh(new THREE.ConeGeometry(0.38, 0.7, 7), flat(0xffffff), 0, 1.78, 0, mountain);
  mesh(new THREE.ConeGeometry(0.7, 1.2, 7), flat(0x86a276), 0.85, 0.6, -0.35, mountain);
  mesh(new THREE.ConeGeometry(0.55, 0.9, 7), flat(0x6f8a62), -0.8, 0.45, 0.45, mountain);

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

  /* ===== bản đồ Việt Nam 3D cỡ lớn phía sau (chỉ hiện ở chế độ hướng dẫn viên) ===== */
  const VN_OUTLINE: [number, number][] = [
    [102.15, 22.35], [102.9, 22.55], [103.6, 22.75], [104.4, 22.85], [105.2, 23.05], [106.0, 22.95],
    [106.8, 22.8], [107.3, 21.95], [107.9, 21.55], [108.05, 21.35], [106.95, 20.85], [106.55, 20.35],
    [106.15, 19.85], [105.85, 19.35], [105.75, 18.75], [105.95, 18.25], [106.35, 17.75], [106.75, 17.35],
    [107.15, 16.95], [107.65, 16.55], [108.25, 16.1], [108.9, 15.35], [109.25, 14.7], [109.45, 13.95],
    [109.35, 13.1], [109.05, 12.45], [108.6, 11.85], [107.95, 11.25], [107.15, 10.75], [106.85, 10.45],
    [106.6, 10.3], [106.35, 10.05], [106.05, 9.8], [105.75, 9.55], [105.45, 9.15], [105.15, 8.85],
    [104.85, 8.6], [104.75, 8.75], [104.95, 9.15], [105.05, 9.55], [105.15, 9.95], [104.95, 10.25],
    [104.75, 10.55], [104.85, 10.95], [105.25, 11.35], [105.75, 11.85], [106.35, 12.35], [106.95, 12.85],
    [107.35, 13.35], [107.45, 13.95], [107.65, 14.55], [107.55, 15.15], [107.25, 15.65], [107.35, 16.05],
    [106.95, 16.45], [106.45, 16.85], [106.05, 17.25], [105.75, 17.65], [105.45, 18.05], [105.05, 18.45],
    [104.65, 18.85], [104.25, 19.25], [103.95, 19.65], [104.25, 20.05], [104.05, 20.45], [103.55, 20.75],
    [103.05, 21.05], [102.85, 21.45], [102.45, 21.85],
  ];
  const MAP_SCALE = 0.85;
  const MAP_DEPTH = 0.3;
  const mapGroup = new THREE.Group();
  mapGroup.position.set(-1.0, 0.85, -7.6);
  scene.add(mapGroup);
  const mapRoot = new THREE.Group();
  mapGroup.add(mapRoot);
  const MX = (lon: number) => (lon - 105.8) * MAP_SCALE;
  const MY = (lat: number) => (lat - 15.6) * MAP_SCALE;

  function roundRect(x: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, R: number) {
    x.beginPath();
    x.moveTo(X + R, Y);
    x.arcTo(X + W, Y, X + W, Y + H, R);
    x.arcTo(X + W, Y + H, X, Y + H, R);
    x.arcTo(X, Y + H, X, Y, R);
    x.arcTo(X, Y, X + W, Y, R);
    x.closePath();
  }
  function makeMapLabel(name: string, sub: string, color: string, w: number) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 180;
    const ctx = c.getContext("2d");
    if (!ctx) return new THREE.Sprite();
    const x: CanvasRenderingContext2D = ctx;
    function draw() {
      x.clearRect(0, 0, 512, 180);
      const grad = x.createLinearGradient(0, 0, 0, 180);
      grad.addColorStop(0, "rgba(5,42,50,.92)");
      grad.addColorStop(1, "rgba(4,24,32,.82)");
      x.fillStyle = grad;
      roundRect(x, 8, 8, 496, 164, 34);
      x.fill();
      x.strokeStyle = color;
      x.lineWidth = 4;
      x.stroke();
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillStyle = "#ffffff";
      x.font = '800 62px "Baloo 2",system-ui,sans-serif';
      x.fillText(name, 256, sub ? 66 : 92);
      if (sub) {
        x.fillStyle = color;
        x.font = '700 34px "Baloo 2",system-ui,sans-serif';
        x.fillText(sub, 256, 128);
      }
    }
    draw();
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    spr.renderOrder = 20;
    spr.scale.set(w, (w * 180) / 512, 1);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        draw();
        tex.needsUpdate = true;
      });
    }
    return spr;
  }

  const extrudeOpt = { depth: MAP_DEPTH, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.055, bevelThickness: 0.055, curveSegments: 8 };
  function clipPoly(poly: any[], above: boolean, cut: number) {
    const out: any[] = [];
    const inside = (p: any) => (above ? p[1] >= cut : p[1] <= cut);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const ain = inside(a);
      const bin = inside(b);
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (cut - a[1]) / (b[1] - a[1]);
        out.push([a[0] + (b[0] - a[0]) * t, cut]);
      }
    }
    return out;
  }
  const vnSideMat = new THREE.MeshStandardMaterial({ color: 0xd0aa6e, roughness: 0.9, metalness: 0.04, side: THREE.DoubleSide });
  function buildZone(poly: any[], color: number, emissive: number) {
    const sh = new THREE.Shape();
    poly.forEach(([lon, lat]: any, i: number) => {
      const px = MX(lon);
      const py = MY(lat);
      if (i) sh.lineTo(px, py);
      else sh.moveTo(px, py);
    });
    sh.closePath();
    const top = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.05, emissive, emissiveIntensity: 0.35, flatShading: true, side: THREE.DoubleSide });
    mapRoot.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, extrudeOpt), [top, vnSideMat]));
  }
  buildZone(clipPoly(VN_OUTLINE, true, 17), 0x2f9e63, 0x0b3a2a);
  buildZone(clipPoly(clipPoly(VN_OUTLINE, true, 11), false, 17), 0xe0b76a, 0x5a3a08);
  buildZone(clipPoly(VN_OUTLINE, false, 11), 0x4fd18b, 0x0e4a3a);

  const northMat = new THREE.MeshStandardMaterial({ color: 0x1f6f4a, roughness: 0.86, metalness: 0.04, flatShading: true });
  const northMat2 = new THREE.MeshStandardMaterial({ color: 0x2d8a5b, roughness: 0.86, metalness: 0.04, flatShading: true });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf6fff8, roughness: 0.6, metalness: 0.02, emissive: 0x9ad9b5, emissiveIntensity: 0.12, flatShading: true });
  [[103.15, 21.55, 0.42, 0.34], [103.7, 22.0, 0.52, 0.42], [104.35, 22.25, 0.62, 0.48], [104.95, 21.85, 0.45, 0.36], [103.55, 20.95, 0.32, 0.28], [105.5, 21.6, 0.28, 0.24]].forEach(([lon, lat, r, h]: any, i: number) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5, 1), i % 2 ? northMat : northMat2);
    m.position.set(MX(lon), MY(lat) + h / 2, MAP_DEPTH + 0.07);
    mapRoot.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.36, h * 0.3, 5, 1), capMat);
    cap.position.set(MX(lon), MY(lat) + h * 0.86, MAP_DEPTH + 0.07);
    mapRoot.add(cap);
  });

  const deltaMat = new THREE.LineBasicMaterial({ color: 0x53e7dc, transparent: true, opacity: 0.9 });
  [
    [[105.5, 10.8], [106.0, 10.2], [106.3, 9.6], [106.2, 9.0]],
    [[106.0, 10.2], [105.4, 9.7], [105.0, 9.1]],
    [[106.3, 9.6], [107.0, 9.2], [107.3, 8.8]],
    [[106.0, 9.5], [106.7, 9.1]],
  ].forEach((line: any) => {
    const pts = line.map(([lon, lat]: any) => new THREE.Vector3(MX(lon), MY(lat), MAP_DEPTH + 0.08));
    mapRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), deltaMat));
  });

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2dbb6a, roughness: 0.8, flatShading: true, side: THREE.DoubleSide });
  function mapPalm(lon: number, lat: number, s: number) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * s, 0.03 * s, 0.34 * s, 6), trunkMat);
    trunk.position.y = 0.17 * s;
    g.add(trunk);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.34 * s, 4, 1), leafMat);
      leaf.position.set(Math.cos(a) * 0.12 * s, 0.36 * s, Math.sin(a) * 0.12 * s);
      leaf.rotation.z = 0.95;
      leaf.rotation.y = a;
      g.add(leaf);
    }
    g.position.set(MX(lon), MY(lat), MAP_DEPTH + 0.12);
    mapRoot.add(g);
  }
  mapPalm(104.55, 9.55, 0.9);
  mapPalm(104.95, 9.1, 0.7);
  mapPalm(107.05, 9.35, 0.8);

  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.08), new THREE.MeshStandardMaterial({ color: 0xff6b4a, roughness: 0.7 }));
  hull.position.y = 0.025;
  boat.add(hull);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), trunkMat);
  mast.position.y = 0.14;
  boat.add(mast);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 3, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true, side: THREE.DoubleSide }));
  sail.position.set(0.02, 0.16, 0);
  boat.add(sail);
  boat.position.set(MX(106.35), MY(9.35), MAP_DEPTH + 0.13);
  mapRoot.add(boat);

  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd36a });
  const baNa = new THREE.Group();
  baNa.position.set(MX(108.65), MY(16.35), MAP_DEPTH + 0.12);
  baNa.scale.setScalar(1.25);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.034, 8, 32, Math.PI), goldMat);
  arch.position.y = 0.1;
  baNa.add(arch);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.035, 0.055), goldMat);
  deck.position.y = 0.1;
  baNa.add(deck);
  [-0.32, 0.32].forEach((dx) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.05, 0.27, 8), goldMat);
    tower.position.set(dx, 0.13, 0);
    baNa.add(tower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), goldMat);
    hand.position.set(dx, 0.28, 0);
    baNa.add(hand);
  });
  mapRoot.add(baNa);

  const haLong = new THREE.Group();
  haLong.position.set(MX(106.85), MY(20.85), MAP_DEPTH + 0.11);
  haLong.scale.setScalar(1.35);
  const halongWater = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), new THREE.MeshBasicMaterial({ color: 0x2fbfd0, side: THREE.DoubleSide }));
  halongWater.scale.y = 0.62;
  halongWater.position.z = -0.04;
  halongWater.userData.back = true;
  haLong.add(halongWater);
  const karstMat = new THREE.MeshBasicMaterial({ color: 0xa9c4b8 });
  const karstMat2 = new THREE.MeshBasicMaterial({ color: 0x7fa395 });
  [[-0.16, 0.02, 0.1, 0.38, 0], [0.05, 0.09, 0.08, 0.5, 1], [0.19, -0.04, 0.07, 0.32, 0]].forEach(([dx, dy, r, h, i]: any) => {
    const karst = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r, h, 6, 1), i ? karstMat2 : karstMat);
    karst.position.set(dx, dy + h / 2, 0);
    haLong.add(karst);
  });
  const junkHull = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: 0xd94f2a }));
  junkHull.position.set(0.17, -0.15, 0.02);
  haLong.add(junkHull);
  const junkSail = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.17, 3, 1), new THREE.MeshBasicMaterial({ color: 0xffe6a8, side: THREE.DoubleSide }));
  junkSail.position.set(0.17, -0.05, 0.02);
  haLong.add(junkSail);
  mapRoot.add(haLong);

  const woodIconMat = new THREE.MeshBasicMaterial({ color: 0x9a6a3a });
  const hoiAn = new THREE.Group();
  hoiAn.position.set(MX(108.2), MY(15.1), MAP_DEPTH + 0.12);
  hoiAn.scale.setScalar(1.55);
  const lanternPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.42, 6), woodIconMat);
  lanternPole.position.y = 0.21;
  hoiAn.add(lanternPole);
  const lanternArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.02), woodIconMat);
  lanternArm.position.set(0.11, 0.4, 0);
  hoiAn.add(lanternArm);
  const lantern = new THREE.Group();
  lantern.position.set(0.22, 0.3, 0);
  hoiAn.add(lantern);
  const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 10), new THREE.MeshBasicMaterial({ color: 0xff5a3c }));
  lantern.add(lanternBody);
  const lanternTop = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.028, 10), goldMat);
  lanternTop.position.y = 0.1;
  lantern.add(lanternTop);
  const lanternBottom = lanternTop.clone();
  lanternBottom.position.y = -0.1;
  lantern.add(lanternBottom);
  const lanternTassel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.1, 6), goldMat);
  lanternTassel.position.y = -0.19;
  lantern.add(lanternTassel);
  mapRoot.add(hoiAn);

  /* chợ nổi miền Tây (Mekong) */
  const mekong = new THREE.Group();
  mekong.position.set(MX(106.0), MY(9.6), MAP_DEPTH + 0.11);
  mekong.scale.setScalar(1.35);
  const mekongWater = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x2fbfd0, side: THREE.DoubleSide }));
  mekongWater.scale.y = 0.62;
  mekongWater.position.z = -0.04;
  mekongWater.userData.back = true;
  mekong.add(mekongWater);
  const basketBoat = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: 0xc08a45, side: THREE.DoubleSide }));
  basketBoat.scale.y = 0.55;
  basketBoat.position.z = 0.03;
  mekong.add(basketBoat);
  const basketRim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 6, 20), new THREE.MeshBasicMaterial({ color: 0x7a5528 }));
  basketRim.scale.y = 0.55;
  basketRim.position.z = 0.04;
  mekong.add(basketRim);
  const basketCanopy = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: 0xffd36a }));
  basketCanopy.position.set(0, -0.02, 0.05);
  mekong.add(basketCanopy);
  const mekongPaddle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.3, 6), woodIconMat);
  mekongPaddle.rotation.z = 0.9;
  mekongPaddle.position.set(0.1, 0.08, 0.07);
  mekong.add(mekongPaddle);
  /* thêm ghe chở trái cây và cây bẹo treo hàng đặc trưng của chợ nổi */
  [[-0.34, -0.1, 0.12, 0xff8a2a], [0.34, 0.08, 0.11, 0x6fcf3a]].forEach(([x, y, r, c]: any) => {
    const b = new THREE.Mesh(new THREE.CircleGeometry(r * 1.5, 14), new THREE.MeshBasicMaterial({ color: 0xc08a45, side: THREE.DoubleSide }));
    b.scale.y = 0.5;
    b.position.set(x, y, 0.03);
    mekong.add(b);
    const f = new THREE.Mesh(new THREE.CircleGeometry(r * 0.7, 10), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, y + 0.05, 0.05);
    mekong.add(f);
  });
  const beoPole = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 0.46), woodIconMat);
  beoPole.position.set(-0.14, 0.18, 0.06);
  mekong.add(beoPole);
  [[-0.14, 0.42, 0xffd23a], [-0.08, 0.36, 0xff8a2a], [-0.2, 0.34, 0x6fcf3a]].forEach(([x, y, c]: any) => {
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    f.position.set(x, y, 0.07);
    mekong.add(f);
  });
  mapRoot.add(mekong);

  /* địa danh phẳng, vẽ theo thứ tự lớp (phần vẽ sau nằm trên) */
  const flatMat = (c: number) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  const fm = (g: any, geo: any, c: number, x: number, y: number) => {
    const o = new THREE.Mesh(geo, flatMat(c));
    o.position.set(x, y, 0);
    g.add(o);
    return o;
  };
  const fr = (g: any, w: number, h: number, x: number, y: number, c: number) => fm(g, new THREE.PlaneGeometry(w, h), c, x, y + h / 2);
  const ft = (g: any, w: number, h: number, x: number, y: number, c: number) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.closePath();
    return fm(g, new THREE.ShapeGeometry(s), c, x, y);
  };
  const fc = (g: any, r: number, x: number, y: number, c: number, seg?: number) => fm(g, new THREE.CircleGeometry(r, seg || 16), c, x, y);
  function landmark(lon: number, lat: number, sc: number) {
    const g = new THREE.Group();
    g.position.set(MX(lon), MY(lat), MAP_DEPTH + 0.12);
    g.scale.setScalar(sc);
    mapRoot.add(g);
    return g;
  }

  /* Hà Nội: Lăng Chủ tịch Hồ Chí Minh (ngôi sao vàng của thủ đô nằm ngay bên cạnh) */
  const lang = landmark(105.1, 20.55, 0.95);
  fr(lang, 0.62, 0.05, 0, 0, 0xbdb5a2);
  fr(lang, 0.5, 0.05, 0, 0.05, 0xd2cbb8);
  fr(lang, 0.38, 0.2, 0, 0.1, 0xc7c1b0);
  for (let i = -3; i <= 3; i++) fr(lang, 0.026, 0.2, i * 0.054, 0.1, 0xf1ede0);
  fr(lang, 0.48, 0.045, 0, 0.3, 0x8f8a7e);
  fr(lang, 0.42, 0.03, 0, 0.345, 0x6f6a60);
  fr(lang, 0.008, 0.16, 0, 0.375, 0x6a4a2a);
  fr(lang, 0.1, 0.065, 0.05, 0.47, 0xd9261c);
  fc(lang, 0.016, 0.05, 0.5025, 0xffdd00, 5);

  /* Huế: Ngọ Môn và Kỳ Đài của Kinh thành Huế */
  const hue = landmark(107.1, 16.55, 0.8);
  fr(hue, 0.66, 0.16, 0, 0, 0xb9a68a);
  [-0.16, 0, 0.16].forEach((x) => fr(hue, 0.08, 0.1, x, 0, 0x2a1a12));
  [-1, 1].forEach((s) => {
    fr(hue, 0.12, 0.07, s * 0.27, 0.16, 0xd2402f);
    fr(hue, 0.18, 0.025, s * 0.27, 0.23, 0xf2c14e);
  });
  fr(hue, 0.46, 0.09, 0, 0.16, 0xd2402f);
  fr(hue, 0.58, 0.03, 0, 0.25, 0xf2c14e);
  fr(hue, 0.3, 0.08, 0, 0.28, 0xd2402f);
  fr(hue, 0.4, 0.03, 0, 0.36, 0xf2c14e);
  ft(hue, 0.34, 0.07, 0, 0.39, 0xf2c14e);
  fr(hue, 0.12, 0.06, -0.52, 0, 0xb9a68a);
  fr(hue, 0.09, 0.06, -0.52, 0.06, 0xc9b79c);
  fr(hue, 0.06, 0.06, -0.52, 0.12, 0xb9a68a);
  fr(hue, 0.01, 0.24, -0.52, 0.18, 0x6a4a2a);
  fr(hue, 0.14, 0.09, -0.45, 0.33, 0xd9261c);
  fc(hue, 0.022, -0.45, 0.375, 0xffdd00, 5);

  /* TP. Hồ Chí Minh: Nhà thờ Đức Bà Sài Gòn */
  const notre = landmark(106.3, 10.95, 1.0);
  fr(notre, 0.36, 0.2, 0, 0, 0xc4553a);
  ft(notre, 0.38, 0.1, 0, 0.2, 0x9c3f2a);
  [-1, 1].forEach((s) => {
    fr(notre, 0.1, 0.38, s * 0.14, 0, 0xc4553a);
    fr(notre, 0.12, 0.025, s * 0.14, 0.38, 0xe8e2d0);
    ft(notre, 0.09, 0.22, s * 0.14, 0.405, 0x6b6b6b);
    fr(notre, 0.008, 0.04, s * 0.14, 0.625, 0x333333);
  });
  fc(notre, 0.036, 0, 0.15, 0xffe9a8);
  fr(notre, 0.07, 0.09, 0, 0, 0x3a2a20);
  fr(notre, 0.08, 0.03, 0, -0.05, 0xe8e2d0);
  fr(notre, 0.025, 0.08, 0, -0.02, 0xffffff);
  fc(notre, 0.02, 0, 0.07, 0xffffff);

  [
    ["HẠ LONG", 106.85, 20.85, 0.88, "#8dffb0", ""],
    ["CẦU VÀNG", 108.65, 16.35, 0.88, "#ffd36a", "BÀ NÀ"],
    ["HỘI AN", 108.2, 15.1, 0.88, "#ffb36a", ""],
    ["CHỢ NỔI", 106.0, 9.6, 0.62, "#53e7dc", "MEKONG"],
    ["LĂNG BÁC", 105.1, 20.55, -0.34, "#ffd36a", "HÀ NỘI"],
    ["KINH THÀNH", 107.1, 16.55, -0.36, "#ff9a7a", "HUẾ"],
    ["SÀI GÒN", 106.3, 10.95, 0.95, "#ff9a7a", "NHÀ THỜ ĐỨC BÀ"],
  ].forEach(([name, lon, lat, dy, color, sub]: any) => {
    const t = makeMapLabel(name, sub, color, 1.15);
    t.position.set(MX(lon), MY(lat) + dy, MAP_DEPTH + 0.54);
    mapRoot.add(t);
  });

  const vnPts = VN_OUTLINE.map(([lon, lat]) => new THREE.Vector3(MX(lon), MY(lat), MAP_DEPTH + 0.066));
  vnPts.push(vnPts[0].clone());
  const coastMat = new THREE.LineBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.85 });
  mapRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vnPts), coastMat));

  const halo = new THREE.Mesh(new THREE.CircleGeometry(6.1, 64), new THREE.MeshBasicMaterial({ color: 0x0a4f5c, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide }));
  halo.position.set(1.0, 0.1, -0.55);
  mapRoot.add(halo);
  const haloRing = new THREE.Mesh(new THREE.RingGeometry(5.86, 6.1, 80), new THREE.MeshBasicMaterial({ color: 0x53e7dc, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
  haloRing.position.copy(halo.position);
  mapRoot.add(haloRing);

  const islTop = new THREE.MeshStandardMaterial({ color: 0x86e06a, roughness: 0.72, metalness: 0.05, emissive: 0x1a5a2a, emissiveIntensity: 0.42, flatShading: true });
  const islSide = new THREE.MeshStandardMaterial({ color: 0xf0d9a0, roughness: 0.9, metalness: 0.04 });
  const islandLabels: any[] = [];
  function addIsland(o: any) {
    const g = new THREE.Group();
    g.position.set(MX(o.lon), MY(o.lat), MAP_DEPTH + 0.055);
    mapRoot.add(g);
    o.discs.forEach(([dx, dy, r, sx, sy]: any) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.94, 0.15, 12, 1), [islSide, islTop, islSide]);
      d.rotation.x = Math.PI / 2;
      d.scale.set(sx || 1, 1, sy || 1);
      d.position.set(dx, dy, 0);
      g.add(d);
    });
    const ringMat = new THREE.MeshBasicMaterial({ color: o.accent, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(o.ring, 0.022, 8, 64), ringMat);
    ring.position.z = -0.035;
    g.add(ring);
    const lab = makeMapLabel(o.name, o.sub, o.accent, 2.0);
    lab.position.set(MX(o.lon) + (o.label.dx || 0), MY(o.lat) + o.label.dy, MAP_DEPTH + 0.55);
    mapRoot.add(lab);
    islandLabels.push({ ring: ring, mat: ringMat, ph: islandLabels.length * 1.7 });
  }
  addIsland({
    name: "Hoàng Sa",
    sub: "QUẦN ĐẢO",
    lon: 112.0,
    lat: 16.6,
    ring: 0.62,
    accent: "#ffd36a",
    label: { dx: -1.35, dy: 3.65 },
    discs: [[-0.22, 0.16, 0.1], [-0.02, 0.25, 0.075], [0.2, 0.14, 0.09], [0.03, -0.02, 0.11], [-0.16, -0.16, 0.065], [0.24, -0.12, 0.055]],
  });
  addIsland({
    name: "Trường Sa",
    sub: "QUẦN ĐẢO",
    lon: 113.8,
    lat: 9.9,
    ring: 0.62,
    accent: "#ffd36a",
    label: { dx: -0.25, dy: 1.1 },
    discs: [[-0.2, 0.18, 0.07], [0.16, 0.2, 0.06], [0.02, -0.02, 0.09], [-0.18, -0.16, 0.05], [0.24, -0.16, 0.055]],
  });
  addIsland({
    name: "Phú Quốc",
    sub: "ĐẢO",
    lon: 103.9,
    lat: 10.2,
    ring: 0.5,
    accent: "#35ffd6",
    label: { dx: 0, dy: 1.0 },
    discs: [[0, 0, 0.13, 1.7, 0.75], [0.16, -0.3, 0.045], [0.03, 0.24, 0.05]],
  });

  /* ngôi sao vàng đánh dấu thủ đô Hà Nội */
  const starCv = document.createElement("canvas");
  starCv.width = starCv.height = 128;
  const starCtx = starCv.getContext("2d");
  if (starCtx) {
    starCtx.translate(64, 64);
    starCtx.shadowColor = "rgba(255,211,106,.95)";
    starCtx.shadowBlur = 20;
    starCtx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 22 : 52;
      starCtx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    starCtx.closePath();
    starCtx.fillStyle = "#ffd36a";
    starCtx.fill();
    starCtx.shadowBlur = 0;
    starCtx.lineWidth = 5;
    starCtx.strokeStyle = "#fff1b8";
    starCtx.stroke();
  }
  const starTex = new THREE.CanvasTexture(starCv);
  starTex.encoding = THREE.sRGBEncoding;
  const capitalStar = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, depthTest: false }));
  capitalStar.position.set(MX(105.85), MY(21.03), MAP_DEPTH + 0.66);
  capitalStar.scale.set(0.72, 0.72, 1);
  capitalStar.renderOrder = 21;
  mapRoot.add(capitalStar);

  [haLong, baNa, hoiAn, mekong].forEach((g) => {
    g.traverse((o: any) => {
      if (o.isMesh || o.isLine) {
        o.renderOrder = o.userData.back ? 18 : 19;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m: any) => {
          if (!m) return;
          m.depthTest = false;
          m.depthWrite = true;
        });
      }
    });
  });
  /* các địa danh mới và chợ nổi: lớp vẽ tăng dần theo thứ tự tạo để chồng hình đúng */
  {
    let rm = 19.1;
    mekong.children.forEach((o: any) => {
      o.renderOrder = rm;
      rm += 0.002;
    });
  }
  {
    let ro = 19.5;
    [lang, hue, notre].forEach((g) =>
      g.traverse((o: any) => {
        if (o.isMesh) {
          o.renderOrder = ro;
          ro += 0.002;
          o.material.depthTest = false;
          o.material.depthWrite = false;
        }
      }),
    );
  }
  capitalStar.material.depthTest = false;
  capitalStar.material.depthWrite = false;

  let mapBaseY = -3.85;

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
  const tourOnly = [tent, plane, mountain];
  const leds: any[] = [];
  const pipe: any[] = [];
  const tourParts: any[] = [];
  const devParts: any[] = [];

  function rack(x: number, z: number, ry?: number, y?: number) {
    const g = new THREE.Group();
    g.position.set(x, y || 0, z);
    g.rotation.y = ry === undefined ? Math.atan2(-x, -z) : ry;
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
    return g;
  }
  rack(2.95, -0.9);
  rack(2.7, -1.6);
  rack(-2.9, -1.4);

  const dc = new THREE.Group();
  devScene.add(dc);
  const dcTop = 0.14;
  mesh(new THREE.CylinderGeometry(1.3, 1.42, 0.16, 10), M(0x151b28, { roughness: 0.45, metalness: 0.65 }), 0, 0.04, 0, dc);
  mesh(new THREE.CylinderGeometry(1.14, 1.2, 0.035, 10), M(0x0c111b, { roughness: 0.35, metalness: 0.8 }), 0, 0.125, 0, dc);
  const dcRing = mesh(
    new THREE.TorusGeometry(1.32, 0.022, 8, 72),
    new THREE.MeshStandardMaterial({ color: 0x1fb5c9, emissive: 0x1fb5c9, emissiveIntensity: 1.1 }),
    0,
    0.13,
    0,
    dc,
  );
  dcRing.rotation.x = Math.PI / 2;
  const dcRacks = [rack(-0.64, -0.46, 0, dcTop), rack(0, -0.46, 0, dcTop), rack(0.64, -0.46, 0, dcTop)];
  dcRacks.forEach((r) => r.scale.setScalar(1.2));
  mesh(new THREE.BoxGeometry(2.0, 0.05, 0.3), M(0x2a3346, { roughness: 0.4, metalness: 0.7 }), 0, 1.46, -0.46, dc);
  mesh(
    new THREE.BoxGeometry(1.9, 0.014, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x35d6ff, emissive: 0x35d6ff, emissiveIntensity: 1.2 }),
    0,
    1.43,
    -0.31,
    dc,
  );
  const cooler = new THREE.Group();
  cooler.position.set(-1.0, dcTop, -0.05);
  cooler.rotation.y = 0.25;
  dc.add(cooler);
  mesh(new THREE.BoxGeometry(0.34, 0.9, 0.42), M(0x20283a, { roughness: 0.45, metalness: 0.6 }), 0, 0.45, 0, cooler);
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.24, 0.045, 0.02), M(0x0b0f17, { roughness: 0.9 }), 0, 0.25 + i * 0.16, 0.215, cooler);
  const coolerLed = mesh(
    new THREE.BoxGeometry(0.12, 0.02, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x35ffb0, emissive: 0x35ffb0, emissiveIntensity: 1 }),
    0,
    0.82,
    0.216,
    cooler,
  );
  const dcHolo = mesh(
    new THREE.TorusGeometry(0.5, 0.012, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.55 }),
    0,
    1.9,
    -0.3,
    dc,
  );
  dcHolo.rotation.x = Math.PI / 2.3;

  const TECH_YAW = Math.PI + 0.22;
  const tech = new THREE.Group();
  tech.position.set(0.82, dcTop, 0.34);
  tech.rotation.y = TECH_YAW;
  tech.scale.setScalar(1.38);
  devScene.add(tech);
  let techFix = 0;
  let techGreet = 0;
  const tcSkin = M(0xf2c9a5);
  const tcShirt = M(0x2f8a8a);
  const tcPants = M(0x263445);
  const tcDark = M(0x10151d, { roughness: 0.45 });
  const tcVest = M(0xffc83d, { roughness: 0.65 });
  mesh(
    new THREE.CircleGeometry(0.34, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    0,
    0.012,
    0,
    tech,
  ).rotation.x = -Math.PI / 2;
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.06, 0.36, 0);
    tech.add(g);
    mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.34, 8), tcPants, 0, -0.17, 0, g);
    mesh(new THREE.SphereGeometry(0.07, 8, 6), tcDark, 0, -0.35, 0.03, g).scale.set(1, 0.5, 1.35);
  });
  mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.35, 14), tcShirt, 0, 0.535, 0, tech);
  [-1, 1].forEach((s) => mesh(new THREE.BoxGeometry(0.03, 0.22, 0.27), tcVest, s * 0.145, 0.55, 0, tech));
  mesh(new THREE.BoxGeometry(0.22, 0.22, 0.032), tcVest, 0, 0.55, 0.131, tech);
  mesh(new THREE.BoxGeometry(0.22, 0.22, 0.032), tcVest, 0, 0.55, -0.131, tech);
  [-1, 1].forEach((s) => mesh(new THREE.BoxGeometry(0.225, 0.022, 0.034), M(0xe8eef8), 0, 0.575, s * 0.132, tech));
  mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 8), tcSkin, 0, 0.725, 0, tech);
  const tcHead = new THREE.Group();
  tcHead.position.set(0, 0.835, 0);
  tech.add(tcHead);
  mesh(new THREE.SphereGeometry(0.12, 16, 12), tcSkin, 0, 0, 0, tcHead);
  [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.017, 6, 6), tcDark, s * 0.045, 0.012, 0.106, tcHead));
  mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), tcVest, 0, 0.028, 0, tcHead);
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 20), tcVest, 0, 0.032, 0.015, tcHead).scale.set(1, 1, 0.86);
  const tcArms = [-1, 1].map((s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.18, 0.66, 0);
    tech.add(g);
    mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.26, 8), tcShirt, 0, -0.13, 0, g);
    mesh(new THREE.SphereGeometry(0.044, 8, 8), tcSkin, 0, -0.275, 0, g);
    return g;
  });
  const tcTablet = new THREE.Group();
  tcTablet.position.set(0, -0.28, 0.07);
  tcArms[0].add(tcTablet);
  mesh(new THREE.BoxGeometry(0.2, 0.14, 0.016), M(0x0d121a, { roughness: 0.35, metalness: 0.6 }), 0, 0, 0, tcTablet);
  const tcScreen = mesh(
    new THREE.PlaneGeometry(0.17, 0.105),
    new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.9 }),
    0,
    0,
    0.009,
    tcTablet,
  );
  const tcTool = new THREE.Group();
  tcTool.position.set(0, -0.275, 0.02);
  tcArms[1].add(tcTool);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6), M(0xc8cfd8, { roughness: 0.25, metalness: 0.85 }), 0, 0, 0.12, tcTool).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.05, 0.028, 0.02), M(0xff8a4a, { roughness: 0.4, metalness: 0.3 }), 0, 0, 0.258, tcTool);
  const tcSpark = mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0 }),
    0,
    -0.3,
    0.15,
    tcArms[1],
  );
  const tcBox = new THREE.Group();
  tcBox.position.set(0.34, 0.02, 0.26);
  tcBox.rotation.y = -0.4;
  tech.add(tcBox);
  mesh(new THREE.BoxGeometry(0.24, 0.16, 0.14), M(0xc23a2e, { roughness: 0.5, metalness: 0.3 }), 0, 0.08, 0, tcBox);
  mesh(new THREE.BoxGeometry(0.2, 0.012, 0.04), M(0x8f2118), 0, 0.165, 0, tcBox);
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

  const TOUR_GAP = 0.24;
  const TOUR_RAD = [-0.05, 0.07, -0.09, 0.05, -0.02];
  const touristLooks: any[] = [
    { shirt: 0x2fd1c5, pants: 0x2e4a8a, skin: 0xf2c9a5, hat: "sun", hatColor: 0xffc83d, pack: 0xff6b4a, scale: 1.38 },
    { shirt: 0xffb03a, pants: 0x444a55, skin: 0xd9a06f, hat: "cap", hatColor: 0x2f7bff, pack: 0x2fd1c5, scale: 1.32 },
    { shirt: 0x7a5cff, pants: 0x2e7d5b, skin: 0xc68642, hat: "none", hair: 0x2a1a12, pack: 0xffb03a, scale: 1.42 },
    { shirt: 0xff6b4a, pants: 0x6a4a2a, skin: 0xf6d7b0, hat: "sun", hatColor: 0xffffff, pack: 0x7a5cff, scale: 1.3 },
    { shirt: 0x46b0ff, pants: 0x33406a, skin: 0xe0aa7c, hat: "cap", hatColor: 0xff6b4a, pack: 0x2fd1c5, scale: 1.36 },
  ];
  function makeTourist(look: any) {
    const g = new THREE.Group();
    g.scale.setScalar(look.scale);
    scene.add(g);
    const skinM = M(look.skin);
    const shirtM = M(look.shirt);
    const pantsM = M(look.pants);
    const darkM = M(0x1b1410, { roughness: 0.4 });
    const hatM = M(look.hatColor || look.shirt, { roughness: 0.7 });
    const legs = [-1, 1].map((s) => {
      const lg = new THREE.Group();
      lg.position.set(s * 0.06, 0.36, 0);
      g.add(lg);
      mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.34, 8), pantsM, 0, -0.17, 0, lg);
      mesh(new THREE.SphereGeometry(0.065, 8, 6), darkM, 0, -0.35, 0.03, lg).scale.set(1, 0.55, 1.35);
      return lg;
    });
    mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.34, 14), shirtM, 0, 0.53, 0, g);
    mesh(new THREE.BoxGeometry(0.2, 0.24, 0.12), M(look.pack, { roughness: 0.85 }), 0, 0.55, -0.16, g);
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 8), skinM, 0, 0.72, 0, g);
    mesh(new THREE.SphereGeometry(0.12, 16, 12), skinM, 0, 0.83, 0, g);
    [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.016, 6, 6), darkM, s * 0.045, 0.84, 0.108, g));
    if (look.hat === "cap") {
      mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hatM, 0, 0.85, 0, g);
      mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 18), hatM, 0, 0.855, 0.085, g).scale.set(1, 1, 0.72);
    } else if (look.hat === "sun") {
      mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.012, 22), hatM, 0, 0.865, 0, g);
      mesh(new THREE.SphereGeometry(0.115, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hatM, 0, 0.865, 0, g);
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 18), M(0xe5483a, { roughness: 0.7 }), 0, 0.876, 0, g);
    } else {
      mesh(new THREE.SphereGeometry(0.123, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M(look.hair || 0x2a1a12, { roughness: 0.9 }), 0, 0.842, -0.005, g);
    }
    const arms = [-1, 1].map((s) => {
      const ag = new THREE.Group();
      ag.position.set(s * 0.18, 0.66, 0);
      g.add(ag);
      mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.26, 8), shirtM, 0, -0.13, 0, ag);
      mesh(new THREE.SphereGeometry(0.045, 8, 8), skinM, 0, -0.28, 0, ag);
      return ag;
    });
    const sh = mesh(new THREE.CircleGeometry(0.17, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }), 0, 0.012, 0, g);
    sh.rotation.x = -Math.PI / 2;
    return { group: g, legs, arms };
  }
  const tourists = touristLooks.map(makeTourist);

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
  let techMsgI = 0;
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
    } else if (modeRef.current === "dev" && near(tech, 0.8, e, 55)) {
      techGreet = 3.4;
      techFix = 0;
      const techMsgs = TECH_MSGS[langRef.current](infoRef.current.name);
      say(techMsgs[techMsgI++ % techMsgs.length]);
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
      pickItem(e) ||
      pickProp(e) ||
      (modeRef.current === "dev" && near(tech, 0.8, e, 55)) ||
      near(modeRef.current === "dev" ? jet : guide, 0.8, e, 55) ||
      near(plane, 0, e, 45)
        ? "pointer"
        : "default";
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
    mapGroup.visible = m === "guide";
    tourists.forEach((tr) => (tr.group.visible = m === "guide"));
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
    mapBaseY = -3.85;
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
    tourists.forEach((tr, i) => {
      if (!tr.group.visible) return;
      const a = ang - TOUR_GAP * (i + 1);
      const rad = RP + TOUR_RAD[i];
      const bob = walking ? Math.abs(Math.sin(phase - i * 1.3)) * 0.028 : 0;
      tr.group.position.set(Math.cos(a) * rad, bob, Math.sin(a) * rad);
      const face = walking
        ? Math.atan2(-Math.sin(a), Math.cos(a))
        : Math.atan2(guide.position.x - tr.group.position.x, guide.position.z - tr.group.position.z);
      let td = face - tr.group.rotation.y;
      td = Math.atan2(Math.sin(td), Math.cos(td));
      tr.group.rotation.y += td * Math.min(1, dt * 6);
      const tsw = walking ? Math.sin(phase - i * 1.3) : Math.sin(phase * 0.3 + i) * 0.05;
      tr.legs[0].rotation.x += (tsw * 0.7 - tr.legs[0].rotation.x) * Math.min(1, dt * 14);
      tr.legs[1].rotation.x += (-tsw * 0.7 - tr.legs[1].rotation.x) * Math.min(1, dt * 14);
      tr.arms[0].rotation.x += (-tsw * 0.55 - tr.arms[0].rotation.x) * Math.min(1, dt * 14);
      tr.arms[1].rotation.x += (tsw * 0.55 - tr.arms[1].rotation.x) * Math.min(1, dt * 14);
    });
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
      techFix = Math.max(0, techFix - dt);
      techGreet = Math.max(0, techGreet - dt);
      const greeting = techGreet > 0;
      const fixing = techFix > 0 && !greeting;
      const techWant = greeting
        ? Math.atan2(cam.position.x - tech.position.x, cam.position.z - tech.position.z)
        : TECH_YAW;
      let tdy = techWant - tech.rotation.y;
      tdy = Math.atan2(Math.sin(tdy), Math.cos(tdy));
      tech.rotation.y += tdy * Math.min(1, dt * (greeting ? 8 : 4));
      tech.position.y +=
        ((greeting ? dcTop + Math.abs(Math.sin(t * 7)) * 0.04 : dcTop) - tech.position.y) * Math.min(1, dt * 10);
      tcTool.visible = !greeting;
      if (greeting) {
        tcArms[1].rotation.z += (1.95 + Math.sin(t * 13) * 0.42 - tcArms[1].rotation.z) * Math.min(1, dt * 14);
        tcArms[1].rotation.x += (-0.12 - tcArms[1].rotation.x) * Math.min(1, dt * 14);
        tcArms[0].rotation.x += (-0.4 - tcArms[0].rotation.x) * Math.min(1, dt * 10);
        tcHead.rotation.x = Math.sin(t * 7) * 0.05;
        tcHead.rotation.y = Math.sin(t * 2.2) * 0.08;
        tcSpark.material.opacity = 0;
      } else {
        tcArms[1].rotation.z += (0 - tcArms[1].rotation.z) * Math.min(1, dt * 10);
        tcArms[1].rotation.x +=
          (-0.42 + Math.sin(t * (fixing ? 13 : 2.4)) * (fixing ? 0.42 : 0.07) - tcArms[1].rotation.x) * Math.min(1, dt * 12);
        tcArms[0].rotation.x += (-0.62 + Math.sin(t * 1.6) * 0.05 - tcArms[0].rotation.x) * Math.min(1, dt * 8);
        tcHead.rotation.x = Math.sin(t * (fixing ? 7 : 1.4)) * (fixing ? 0.14 : 0.05);
        tcHead.rotation.y = Math.sin(t * (fixing ? 4 : 0.8)) * (fixing ? 0.18 : 0.1);
        tcSpark.material.opacity = fixing ? Math.max(0, Math.sin(t * 22)) * 0.9 : 0;
      }
      tcScreen.material.opacity = 0.55 + (Math.sin(t * 4) > 0.3 ? 0.4 : 0.1);
      dcHolo.rotation.z += dt * (fixing ? 1.6 : 0.7);
      dcHolo.position.y = 1.9 + Math.sin(t * 1.5) * 0.05;
      coolerLed.material.emissiveIntensity = Math.sin(t * 3) > 0.5 ? 1.8 : 0.5;
    }
    popT = Math.max(0, popT - dt * 2.2);
    guide.scale.setScalar(1.55 * (1 + Math.sin(popT * Math.PI) * 0.25));
    /* bản đồ Việt Nam 3D: lơ lửng, xoay theo camera, các đảo phát sáng */
    mapGroup.position.y = mapBaseY + Math.sin(t * 0.55) * 0.09;
    const mapWant = Math.atan2(cam.position.x - mapGroup.position.x, cam.position.z - mapGroup.position.z);
    mapGroup.rotation.y += (mapWant - mapGroup.rotation.y) * Math.min(1, dt * 2.2);
    mapGroup.rotation.z = -0.0873 + Math.sin(t * 0.35) * 0.012;
    coastMat.opacity = 0.7 + Math.sin(t * 1.6) * 0.22;
    haloRing.material.opacity = 0.16 + Math.sin(t * 1.1) * 0.06;
    islandLabels.forEach((o) => {
      const k = 1 + Math.sin(t * 2.2 + o.ph) * 0.07;
      o.ring.scale.setScalar(k);
      o.mat.opacity = 0.48 + Math.sin(t * 2.2 + o.ph) * 0.22;
    });
    const sk = 0.72 * (1 + Math.sin(t * 2.6) * 0.12);
    capitalStar.scale.set(sk, sk, 1);
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
