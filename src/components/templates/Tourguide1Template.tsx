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
  RowKind,
  TemplateProps,
  formatRole,
  kindOf,
  loadThree,
  openHref,
} from "./template-utils";

type Mode = "guide" | "dev";
type Lang = "vi" | "en";

const NOTE = "NFC Project, designed by Nguyễn Quốc Nhu";
const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

interface ExtraRow {
  kind: RowKind;
  label: string;
  text: string;
  href?: string;
  emoji?: string;
}

interface ModeData {
  role: string;
  bio: string;
  chips: string[];
  props: string[];
  cta: string;
  ctaType: "phone" | "email";
  extras: ExtraRow[];
  switchMsg: string;
  msgs: (n: string) => string[];
  tips: string[];
}

const MODES: Record<Lang, Record<Mode, ModeData>> = {
  vi: {
    guide: {
      role: "Hướng dẫn viên du lịch",
      bio: "Đồng hành và khám phá Việt Nam",
      chips: [],
      props: ["🗺️", "🧭", "📸", "🎒"],
      cta: "Đặt tour ngay",
      ctaType: "phone",
      extras: [
        { kind: "pin", label: "Khu vực dẫn tour", text: "Đà Nẵng · Hội An · Huế", href: maps("Đà Nẵng") },
        { kind: "lang", label: "Ngôn ngữ", text: "Tiếng Việt · English · 日本語", emoji: "🗣️" },
      ],
      switchMsg: "Chế độ hướng dẫn viên: cả đoàn sẵn sàng lên đường!",
      msgs: (n: string) => [
        `Xin chào! Mình là ${n}, hướng dẫn viên của bạn!`,
        "Theo mình nhé, điểm đến đẹp lắm đó!",
        "Cả đoàn đi theo mình, đừng để lạc nha!",
        "Mình dẫn đoàn đi từ Hà Nội, qua Huế, đến TP.HCM nhé!",
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
      chips: ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD"],
      props: ["🐳", "☸️", "⚙️", "🔐"],
      cta: "Liên hệ hợp tác",
      ctaType: "email",
      extras: [
        { kind: "stack", label: "Công nghệ", text: "Linux · Docker · K8s · Terraform · AWS", emoji: "🛠️" },
        { kind: "work", label: "Dịch vụ", text: "CI/CD · Cloud · Giám sát · Bảo mật", emoji: "☁️" },
      ],
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
      bio: "Accompany and explore Vietnam",
      chips: [],
      props: ["🗺️", "🧭", "📸", "🎒"],
      cta: "Book a tour",
      ctaType: "phone",
      extras: [
        { kind: "pin", label: "Tour areas", text: "Da Nang · Hoi An · Hue", href: maps("Da Nang") },
        { kind: "lang", label: "Languages", text: "Vietnamese · English · Japanese", emoji: "🗣️" },
      ],
      switchMsg: "Tour guide mode: the whole group is ready to go!",
      msgs: (n: string) => [
        `Hello! I'm ${n}, your tour guide!`,
        "Follow me, the destinations are gorgeous!",
        "Stay with the group, don't get lost!",
        "I'll take the group from Hanoi through Hue to Ho Chi Minh City!",
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
      chips: ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD"],
      props: ["🐳", "☸️", "⚙️", "🔐"],
      cta: "Work with me",
      ctaType: "email",
      extras: [
        { kind: "stack", label: "Tech stack", text: "Linux · Docker · K8s · Terraform · AWS", emoji: "🛠️" },
        { kind: "work", label: "Services", text: "CI/CD · Cloud · Monitoring · Security", emoji: "☁️" },
      ],
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
    langLabel: string;
    foldLabel: string;
    canvasLabel: string;
    hint: string;
    plane: string;
    robot: string;
    satellite: string;
    evCar: string;
    phoneLabel: string;
    mailLabel: string;
    fbLabel: string;
    share: string;
    shared: string;
    copied: string;
    shareFail: string;
    nfc: string;
    tourists: string[];
  }
> = {
  vi: {
    guideTab: "🧭 Hướng dẫn viên",
    devTab: "💻 IT DevOps",
    modeLabel: "Chọn công việc",
    langLabel: "Chọn ngôn ngữ",
    foldLabel: "Thu gọn hoặc mở rộng thông tin",
    canvasLabel:
      "Bản đồ 3D Việt Nam hình chữ S cùng Hoàng Sa, Trường Sa, Phú Quốc: hướng dẫn viên dẫn đoàn du khách đi từ Hà Nội đến TP.HCM, hoặc robot DevOps chạy giữa các máy chủ",
    hint: "Chạm vào mình để chào nhé!",
    plane: "Chuyến bay khám phá sắp cất cánh!",
    robot: "Robot chạy tới xem nội dung của bạn nè!",
    satellite: "Vệ tinh đang đồng bộ dữ liệu về trung tâm.",
    evCar: "Xe điện bay tự lái đang giao hàng nhanh, đúng giờ.",
    phoneLabel: "Điện thoại / Zalo",
    mailLabel: "Email",
    fbLabel: "Facebook",
    share: "Chia sẻ thẻ này",
    shared: "Đã chia sẻ",
    copied: "Đã sao chép thông tin liên hệ",
    shareFail: "Không chia sẻ được, hãy thử lại",
    nfc: "Chạm điện thoại vào thẻ NFC để nhận liên hệ",
    tourists: [
      "Cảm ơn bạn, tour tuyệt vời quá!",
      "Chờ mình chụp tấm ảnh nữa nhé!",
      "Cả đoàn theo sát hướng dẫn viên nè!",
      "Cảnh ở đây đẹp thật đó!",
    ],
  },
  en: {
    guideTab: "🧭 Tour Guide",
    devTab: "💻 IT DevOps",
    modeLabel: "Choose a role",
    langLabel: "Choose a language",
    foldLabel: "Collapse or expand info",
    canvasLabel:
      "S-shaped 3D map of Vietnam with the Paracel and Spratly islands and Phu Quoc: a tour guide leading tourists from Hanoi to Ho Chi Minh City, or a DevOps robot moving between servers",
    hint: "Tap me to say hello!",
    plane: "The adventure flight is about to take off!",
    robot: "The robot is coming over to check out your content!",
    satellite: "A satellite is syncing data back to the hub.",
    evCar: "An autonomous flying EV is delivering fast, on time.",
    phoneLabel: "Phone / Zalo",
    mailLabel: "Email",
    fbLabel: "Facebook",
    share: "Share this card",
    shared: "Shared",
    copied: "Contact details copied",
    shareFail: "Could not share, please try again",
    nfc: "Tap your phone on the NFC card to get in touch",
    tourists: [
      "Thanks, the tour was amazing!",
      "Wait, let me take one more photo!",
      "The whole group is following the guide!",
      "The scenery here is so beautiful!",
    ],
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
.tg1-template{--bg:#062a33;--bg2:#0e5b66;--card:rgba(8,48,58,.76);--line:rgba(140,235,230,.26);--text:#effffd;--muted:#a3cfcc;--sun:#ffc83d;--coral:#ff6b4a;--lagoon:#2ee0c0;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Baloo 2",system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:500}
.tg1-template *{box-sizing:border-box;margin:0}
.tg1-template .stage{position:absolute;inset:0;background:linear-gradient(180deg,#5ec3ff 0,#aee4ff 55%,#fff0c8 100%)}
.tg1-template #gl{position:relative;z-index:1;width:100%;height:100%;display:block;touch-action:none}
.tg1-template .sky2{position:absolute;inset:0;opacity:0;transition:opacity .8s;background:radial-gradient(circle at 20% 20%,#fff 0 1px,transparent 2px),radial-gradient(circle at 70% 12%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 85% 38%,#fff 0 1px,transparent 2px),radial-gradient(circle at 40% 8%,#cde 0 1px,transparent 2px),radial-gradient(circle at 12% 45%,#fff 0 1px,transparent 2px),radial-gradient(circle at 60% 30%,#fff 0 1px,transparent 2px),linear-gradient(180deg,#120e3d 0,#2a2a7c 55%,#0f6a82 100%)}
.tg1-template .stage.dev .sky2{opacity:1}
.tg1-template .lang{position:absolute;left:10px;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:4;display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,40,60,.5)}
.tg1-template .lang button{border:0;background:transparent;font:inherit;font-weight:700;font-size:12px;padding:5px 10px;border-radius:999px;cursor:pointer;color:#16414d}
.tg1-template .lang button.on{background:linear-gradient(90deg,#ff8a4a,#ffc83d);color:#2a1200}
.tg1-template .switch{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:4;display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,40,60,.5)}
.tg1-template .switch button{border:0;background:transparent;font:inherit;font-weight:700;font-size:14px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#16414d;white-space:nowrap}
.tg1-template .switch button.on{background:linear-gradient(90deg,#ff8a4a,#ffc83d);color:#2a1200}
.tg1-template .stage.dev .switch button.on{background:linear-gradient(90deg,#7a5cff,#1fd1e0);color:#fff}
.tg1-template .switch button:focus-visible{outline:2px solid #0a7f96;outline-offset:2px}
.tg1-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:240px;padding:8px 13px;border-radius:14px;background:#fff;color:#08303b;font-size:14px;font-weight:600;line-height:1.35;text-align:center;box-shadow:0 6px 18px -8px rgba(0,60,80,.5);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.tg1-template .bubble.on{opacity:1;transform:translateX(-50%)}
.tg1-template .card{position:absolute;z-index:5;left:0;right:0;bottom:0;max-height:58vh;max-height:58dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,30,50,.5);transition:max-height .35s ease}
.tg1-template .card.min{max-height:215px}
.tg1-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.tg1-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid #ff9f1c;background:#fff;box-shadow:0 0 25px 8px color-mix(in srgb,var(--sun) 35%,transparent),0 0 60px 15px color-mix(in srgb,var(--sun) 15%,transparent),0 8px 22px -8px rgba(0,0,0,.5);animation:tg1-avatar-pulse 3s ease-in-out infinite;will-change:transform}
.tg1-template .avatar svg,.tg1-template .avatar img{position:relative;z-index:1;width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.tg1-template .avatar .halo{position:absolute;inset:0;border-radius:50%;border:2px solid color-mix(in srgb,var(--sun) 60%,transparent);animation:tg1-avatar-ripple 2.4s ease-out infinite;pointer-events:none}
.tg1-template .avatar .halo:nth-child(2){animation-delay:.8s}
.tg1-template .avatar .halo:nth-child(3){animation-delay:1.6s}
@keyframes tg1-avatar-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes tg1-avatar-ripple{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.6);opacity:0}}
.tg1-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.tg1-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.tg1-template .card.min .fold svg{transform:rotate(180deg)}
.tg1-template .fold:focus-visible,.tg1-template a.row:focus-visible{outline:2px solid var(--lagoon);outline-offset:3px}
.tg1-template .who{text-align:center}
.tg1-template .co{display:inline-block;padding:2px 12px;border-radius:999px;background:color-mix(in srgb,var(--sun) 18%,transparent);border:1px solid var(--line);font-size:12.5px;font-weight:700;letter-spacing:.2px}
.tg1-template h1{margin-top:6px;font-size:27px;font-weight:800;line-height:1.15}
.tg1-template .bio{margin:6px auto 0;max-width:34ch;color:var(--muted);font-size:15px;line-height:1.4}
.tg1-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.tg1-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--text);background:color-mix(in srgb,var(--sun) 14%,transparent)}
.tg1-template .rows{display:grid;gap:10px;margin-top:16px}
.tg1-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.tg1-template a.row:hover,.tg1-template a.row:active{border-color:var(--sun);transform:translateY(-1px)}
.tg1-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px;overflow:hidden}
.tg1-template .ico img{width:24px;height:24px;object-fit:contain}
.tg1-template .ico svg{width:19px;height:19px;fill:currentColor}
.tg1-template .row span{font-size:16px;font-weight:600;line-height:1.25;word-break:break-word}
.tg1-template .nfc{display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;color:var(--muted);margin-top:6px}
.tg1-template .nfc i{flex:none;width:8px;height:8px;border-radius:50%;background:var(--sun);animation:tg1-pulse 2s infinite}
@keyframes tg1-pulse{0%{box-shadow:0 0 0 0 var(--sun)}70%,100%{box-shadow:0 0 0 10px transparent}}
.tg1-template .stage.dev + .card{--text:#effffd;--muted:#a9d6d2;--line:rgba(140,255,200,.28);--sun:#ffc83d;--lagoon:#2ee0c0;--bg:#07222c;background:rgba(6,28,40,.38);backdrop-filter:blur(9px) saturate(1.6);-webkit-backdrop-filter:blur(9px) saturate(1.6);box-shadow:0 -14px 70px -18px rgba(118,185,0,.45),inset 0 1px 0 rgba(180,255,120,.25)}
.tg1-template .stage.dev + .card .row{background:rgba(5,24,34,.4)}
.tg1-template .stage.dev + .card .scroll{text-shadow:0 1px 6px rgba(0,20,30,.75)}
@media (max-width:560px){
.tg1-template .switch{left:auto;right:8px;transform:none}
.tg1-template .switch button{font-size:11px;padding:5px 8px}
.tg1-template .lang{left:8px}
.tg1-template .lang button{font-size:11px;padding:5px 8px}
.tg1-template .bubble{top:calc(env(safe-area-inset-top,0px) + 54px)}
}
@media (min-width:860px){
.tg1-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,30,50,.5)}
.tg1-template .card.min{max-height:none}
.tg1-template .avatar{position:relative;top:auto;left:auto;margin:30px auto 0}
.tg1-template .scroll{padding:14px 24px 28px;flex:1}
.tg1-template .fold{display:none}
.tg1-template .switch,.tg1-template .bubble{left:calc((100% - var(--panel))/2)}
.tg1-template .nfc{justify-content:flex-start}
.tg1-template .who{text-align:center}.tg1-template .chips{justify-content:center}.tg1-template h1{font-size:34px}
.tg1-template .stage.dev + .card{box-shadow:-14px 0 70px -18px rgba(118,185,0,.45),inset 1px 0 0 rgba(180,255,120,.25)}
}
@media (prefers-reduced-motion:reduce){.tg1-template .nfc i{animation:none}.tg1-template .avatar,.tg1-template .avatar .halo{animation:none}.tg1-template .card{transition:none}}
`;

interface SceneInfo {
  name: string;
  phone: string;
  email: string;
  facebook: string;
}

export interface Tourguide1TemplateProps extends TemplateProps {
  initialMode?: Mode;
  hideModeSwitch?: boolean;
}

export default function Tourguide1Template({
  user,
  items,
  initialMode = "guide",
  hideModeSwitch = true,
}: Tourguide1TemplateProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [lang, setLang] = useState<Lang>("vi");
  const [folded, setFolded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const modeRef = useRef<Mode>(mode);
  const langRef = useRef<Lang>(lang);
  const sceneRef = useRef<{ setMode: (m: Mode, initial?: boolean) => void } | null>(null);

  const ui = UI[lang];
  const d = MODES[lang][mode];
  const roleLabel = formatRole(user.role?.name);

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

  const info = useMemo<SceneInfo>(() => {
    const find = (k: RowKind) => rows.find((r) => r.kind === k);
    return {
      name: user.fullname,
      phone: find("phone")?.href ?? "",
      email: find("mail")?.href ?? (user.email ? `mailto:${user.email}` : ""),
      facebook: find("fb")?.href ?? "",
    };
  }, [rows, user.fullname, user.email]);

  const infoRef = useRef(info);
  useEffect(() => {
    infoRef.current = info;
  }, [info]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

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
        handle = setupScene(THREE, canvasRef.current, cardRef.current, langRef, modeRef, infoRef);
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
    sceneRef.current?.setMode(mode, false);
  }, [mode]);

  useEffect(() => {
    sceneRef.current?.setMode(modeRef.current, true);
  }, [lang]);

  return (
    <div className="tg1-template">
      <style>{CSS}</style>

      <div className={`stage${mode === "dev" ? " dev" : ""}`}>
        <div className="sky2" />
        <div className="lang" role="tablist" aria-label={ui.langLabel}>
          <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>
            VI
          </button>
          <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
        {!hideModeSwitch && (
          <div className="switch" role="tablist" aria-label={ui.modeLabel}>
            <button type="button" role="tab" aria-selected={mode === "guide"} className={mode === "guide" ? "on" : ""} onClick={() => setMode("guide")}>
              {ui.guideTab}
            </button>
            <button type="button" role="tab" aria-selected={mode === "dev"} className={mode === "dev" ? "on" : ""} onClick={() => setMode("dev")}>
              {ui.devTab}
            </button>
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
            <span className="co">{roleLabel}</span>
            <h1>{user.fullname}</h1>
            <p className="bio">{d.bio}</p>
            {d.chips.length > 0 && (
              <div className="chips">
                {d.chips.map((chip) => (
                  <span className="chip" key={chip}>{chip}</span>
                ))}
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
                <a
                  className="row"
                  key={row.id}
                  href={row.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
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
  langRef: React.MutableRefObject<Lang>,
  modeRef: React.MutableRefObject<Mode>,
  infoRef: React.MutableRefObject<SceneInfo>,
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

  /* ===== hòn đảo (chỉ dùng cho chế độ DevOps) ===== */
  const i0 = scene.children.length;
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
      const lf = mesh(
        new THREE.SphereGeometry(0.34, 8, 6),
        flat(k % 2 ? 0x2fa24a : 0x3cb85a),
        tx + Math.cos(a) * 0.3,
        ty,
        Math.sin(a) * 0.3,
        g,
      );
      lf.scale.set(1, 0.1, 0.3);
      lf.rotation.set(0, -a, -0.35);
    }
    mesh(new THREE.SphereGeometry(0.07, 8, 8), M(0x6a4a2a), tx, ty - 0.05, 0, g);
  }
  [[2.9, 0.3, 1, 0.3], [-2.8, -0.6, 1.1, -0.3], [1.4, 2.7, 0.9, 0.25], [-1.9, 2.3, 1, -0.25], [0.3, -3.0, 1.05, 0.2], [2.2, -2.2, 0.9, 0.3]].forEach((p: any) =>
    palm(p[0], p[1], p[2], p[3]),
  );
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
  const isle = scene.children.slice(i0).filter((o: any) => o !== tent);
  tent.visible = false;

  /* mây + mặt trời */
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

  /* máy bay giấy */
  const plane = new THREE.Group();
  const pin = new THREE.Group();
  plane.add(pin);
  scene.add(plane);
  mesh(new THREE.ConeGeometry(0.07, 0.55, 8), M(0xffffff), 0, 0, 0, pin).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.78, 0.02, 0.18), M(0xffffff), 0, 0, -0.05, pin);
  mesh(new THREE.BoxGeometry(0.22, 0.02, 0.1), M(0xff6b4a), 0, 0, -0.24, pin);
  mesh(new THREE.BoxGeometry(0.02, 0.14, 0.12), M(0xff6b4a), 0, 0.06, -0.24, pin);
  pin.rotation.z = 0.3;

  /* cảnh DevOps (hiện khi chọn IT DevOps) */
  const devScene = new THREE.Group();
  devScene.visible = false;
  scene.add(devScene);
  const tourOnly: any[] = [plane];
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
  const ringLine = mesh(
    new THREE.TorusGeometry(3.1, 0.012, 6, 80),
    new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.5 }),
    0,
    1.0,
    0,
    devScene,
  );
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

  /* vệ tinh + xe điện bay (chỉ hiện ở chế độ DevOps) */
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
    g.userData.led = mesh(
      new THREE.SphereGeometry(0.024, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff3b3b, emissiveIntensity: 1 }),
      0,
      -0.12,
      0.15,
      g,
    );
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
    mesh(
      new THREE.BoxGeometry(0.24, 0.09, 0.26),
      M(0x9fe8ff, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8 }),
      0,
      0.09,
      -0.04,
      g,
    );
    mesh(
      new THREE.BoxGeometry(0.31, 0.012, 0.46),
      new THREE.MeshStandardMaterial({ color: 0x76b900, emissive: 0x76b900, emissiveIntensity: 0.8 }),
      0,
      0.0,
      0,
      g,
    ).scale.set(1, 1, 1);
    [-1, 1].forEach((s) => {
      mesh(new THREE.BoxGeometry(0.07, 0.03, 0.02), lamp, s * 0.09, 0.0, 0.315, g);
      mesh(
        new THREE.BoxGeometry(0.07, 0.03, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2a2a, emissiveIntensity: 1 }),
        s * 0.09,
        0.0,
        -0.315,
        g,
      );
      [-1, 1].forEach((q) => mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 14), cyan, s * 0.13, -0.065, q * 0.2, g));
    });
    const gl = mesh(
      new THREE.CircleGeometry(0.24, 20),
      new THREE.MeshBasicMaterial({ color: 0x35d6ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }),
      0,
      -0.1,
      0,
      g,
    );
    gl.rotation.x = -Math.PI / 2;
    const tr = mesh(
      new THREE.ConeGeometry(0.07, 0.5, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x6fe8ff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      0,
      0,
      -0.56,
      g,
    );
    tr.rotation.x = -Math.PI / 2;
    g.userData.glow = gl;
    return g;
  }
  [[0x2ee6c5, 4.1, 2.4, 0.42, 1, 0], [0xffffff, 4.5, 3.0, 0.33, -1, 2.2], [0xff8a4a, 3.9, 3.5, 0.5, 1, 4.1]].forEach(([c, R, y, sp, dir, ph]: any) => {
    const e = evCar(c);
    e.userData.o = { R, y, sp, dir, ph };
    evCars.push(e);
  });

  /* hướng dẫn viên 3D */
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
  const shadow = mesh(
    new THREE.CircleGeometry(0.2, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
    0,
    0.012,
    0,
  );
  shadow.rotation.x = -Math.PI / 2;

  /* bản đồ Việt Nam hình chữ S + Hoàng Sa, Trường Sa, Phú Quốc (chỉ hiện ở chế độ hướng dẫn viên) */
  const vn = new THREE.Group();
  scene.add(vn);
  const P = (lo: number, la: number) => [(lo - 105.6) * 0.55, -(la - 15.9) * 0.4];
  mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.4, 64), M(0x2aa9d6, { roughness: 0.3, metalness: 0.1 }), 0, -0.38, 0, vn);
  mesh(new THREE.ConeGeometry(3.7, 2.2, 10, 1), flat(0x6f7f86), 0, -1.68, 0, vn).rotation.x = Math.PI;
  const shp = new THREE.Shape();
  [
    [102.15, 22.4], [103.0, 22.75], [104.0, 22.8], [105.0, 23.2], [106.0, 22.95], [106.7, 22.85],
    [107.4, 22.35], [108.05, 21.55], [107.4, 21.1], [106.9, 20.8], [106.55, 20.4], [106.3, 20.0],
    [106.3, 19.4], [106.3, 18.8], [106.6, 18.2], [107.0, 17.5], [107.35, 16.95], [108.15, 16.4],
    [108.5, 16.0], [108.75, 15.4], [109.2, 14.2], [109.35, 13.2], [109.3, 12.2], [109.2, 11.4],
    [108.3, 10.95], [107.4, 10.45], [107.0, 10.2], [106.8, 9.7], [106.2, 9.3], [105.4, 8.7],
    [104.85, 8.65], [104.8, 9.3], [105.1, 9.9], [104.5, 10.4], [104.75, 11.1], [105.4, 12.3],
    [106.2, 12.4], [106.9, 12.5], [107.6, 12.8], [107.55, 13.9], [107.3, 14.8], [106.4, 15.3],
    [105.4, 15.9], [104.9, 16.4], [104.5, 17.2], [104.3, 18.2], [104.2, 19.0], [103.4, 19.9],
    [103.0, 20.7], [102.7, 21.3], [102.3, 21.9],
  ].forEach(([lo, la], i) => {
    const p = P(lo, la);
    if (i) shp.lineTo(p[0], -p[1]);
    else shp.moveTo(p[0], -p[1]);
  });
  const land = mesh(
    new THREE.ExtrudeGeometry(shp, { depth: 0.3, bevelEnabled: false }),
    [M(0x6fcf6a), M(0xd9c48a)],
    0,
    -0.3,
    0,
    vn,
  );
  land.rotation.x = -Math.PI / 2;
  /* quần đảo */
  const isl = (x: number, z: number, r: number) => {
    mesh(new THREE.CylinderGeometry(r, r * 1.2, 0.16, 12), M(0xf2dfa5), x, -0.12, z, vn);
    mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.03, 12), M(0x4cc06a), x, -0.035, z, vn);
  };
  [[2.55, -0.2, 0.12], [2.75, -0.1, 0.08], [2.4, -0.04, 0.09], [2.65, -0.38, 0.07]].forEach((p: any) => isl(p[0], p[1], p[2]));
  [[2.3, 2.0, 0.1], [2.62, 2.15, 0.07], [2.0, 2.25, 0.08], [2.45, 1.7, 0.07], [2.15, 1.75, 0.06], [2.7, 2.45, 0.06], [1.9, 2.0, 0.05]].forEach((p: any) =>
    isl(p[0], p[1], p[2]),
  );
  mesh(new THREE.CylinderGeometry(1, 1, 0.3, 24), M(0xd9c48a), -1.0, -0.15, 2.4, vn).scale.set(0.15, 1, 0.3);
  mesh(new THREE.CylinderGeometry(1, 1, 0.02, 24), M(0x6fcf6a), -1.0, 0, 2.4, vn).scale.set(0.12, 1, 0.26);
  palm(-1.0, 2.4, 0.4, 0.2);
  vn.add(scene.children[scene.children.length - 1]);

  /* công trình nhỏ tiêu biểu */
  const lmk = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    vn.add(g);
    return g;
  };
  const bx = (w: number, h: number, d: number, c: any, x: number, y: number, z: number, g: any) =>
    mesh(new THREE.BoxGeometry(w, h, d), M(c), x, y + h / 2, z, g);
  function cathedral(x: number, z: number, body: number, spire: number, statue: boolean) {
    const g = lmk(x, z);
    bx(0.28, 0.17, 0.22, body, 0, 0, 0, g);
    mesh(new THREE.ConeGeometry(0.17, 0.09, 4), M(spire), 0, 0.215, 0, g).rotation.y = Math.PI / 4;
    [-1, 1].forEach((s) => {
      bx(0.09, 0.36, 0.09, body, s * 0.095, 0, 0.09, g);
      bx(0.1, 0.025, 0.1, 0xe8e2d0, s * 0.095, 0.36, 0.09, g);
      mesh(new THREE.ConeGeometry(0.065, 0.2, 4), M(spire), s * 0.095, 0.485, 0.09, g).rotation.y = Math.PI / 4;
    });
    mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }), 0, 0.12, 0.112, g);
    bx(0.06, 0.08, 0.012, 0x3a2a20, 0, 0, 0.113, g);
    if (statue) {
      bx(0.04, 0.03, 0.04, 0xe8e2d0, 0, 0, 0.22, g);
      mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.07, 8), M(0xffffff), 0, 0.065, 0.22, g);
    }
  }
  cathedral(-0.8, -2.0, 0x8d867c, 0x4f4a45, false); /* Nhà thờ Lớn Hà Nội */
  cathedral(0, 1.9, 0xc4553a, 0x6b6b6b, true); /* Nhà thờ Đức Bà Sài Gòn */
  {
    const g = lmk(-1.15, -2.3); /* Lăng Chủ tịch Hồ Chí Minh */
    bx(0.46, 0.04, 0.3, 0xcfc8b8, 0, 0, 0, g);
    bx(0.34, 0.04, 0.22, 0xd8d2c2, 0, 0.04, 0, g);
    bx(0.26, 0.14, 0.16, 0xc7c1b0, 0, 0.08, 0, g);
    bx(0.32, 0.025, 0.22, 0x8f8a7e, 0, 0.22, 0, g);
    for (let i = -2; i <= 2; i++) bx(0.018, 0.14, 0.018, 0xe6e1d3, i * 0.05, 0.08, 0.095, g);
  }
  {
    const g = lmk(0.15, -0.4);
    const red = 0xd2402f;
    const goldC = 0xf2c14e; /* Ngọ Môn - Kinh thành Huế */
    bx(0.54, 0.14, 0.22, 0xb9a68a, 0, 0, 0, g);
    [-0.12, 0, 0.12].forEach((a) => bx(0.07, 0.09, 0.01, 0x2a1a12, a, 0, 0.111, g));
    bx(0.38, 0.07, 0.13, red, 0, 0.14, 0, g);
    bx(0.46, 0.02, 0.18, goldC, 0, 0.21, 0, g);
    bx(0.36, 0.02, 0.14, goldC, 0, 0.23, 0, g);
    bx(0.2, 0.06, 0.09, red, 0, 0.25, 0, g);
    bx(0.28, 0.02, 0.13, goldC, 0, 0.31, 0, g);
    bx(0.18, 0.02, 0.09, goldC, 0, 0.33, 0, g);
    [-1, 1].forEach((s) => {
      bx(0.1, 0.06, 0.1, red, s * 0.22, 0.14, 0, g);
      bx(0.15, 0.02, 0.14, goldC, s * 0.22, 0.2, 0, g);
    });
  }
  {
    const g = lmk(0.15, -0.12); /* Kỳ Đài Huế */
    bx(0.2, 0.06, 0.2, 0xb9a68a, 0, 0, 0, g);
    bx(0.14, 0.06, 0.14, 0xc9b79c, 0, 0.06, 0, g);
    bx(0.09, 0.07, 0.09, 0xb9a68a, 0, 0.12, 0, g);
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.24, 6), M(0x6a4a2a), 0, 0.31, 0, g);
    mesh(new THREE.PlaneGeometry(0.13, 0.09), M(0xd9261c, { side: THREE.DoubleSide }), 0.075, 0.39, 0, g);
    mesh(new THREE.CircleGeometry(0.022, 5), new THREE.MeshBasicMaterial({ color: 0xffdd00, side: THREE.DoubleSide }), 0.075, 0.39, 0.002, g);
  }
  function label(txt: string, x: number, y: number, z: number) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const q = c.getContext("2d");
    if (!q) return;
    q.fillStyle = "rgba(255,255,255,.9)";
    q.beginPath();
    (q.roundRect || q.rect).call(q, 4, 8, 248, 48, 24);
    q.fill();
    q.font = '700 26px "Baloo 2",system-ui,sans-serif';
    q.textAlign = "center";
    q.textBaseline = "middle";
    q.fillStyle = "#08303b";
    q.fillText(txt, 128, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    spr.scale.set(0.95, 0.24, 1);
    spr.position.set(x, y, z);
    vn.add(spr);
  }
  label("Hà Nội", -0.97, 0.95, -2.15);
  label("Huế", 0.15, 0.72, -0.4);
  label("TP. Hồ Chí Minh", 0, 0.95, 1.9);
  label("Hoàng Sa", 2.6, 0.38, -0.25);
  label("Trường Sa", 2.3, 0.38, 1.85);
  label("Phú Quốc", -1.0, 0.62, 2.4);

  /* đường đi của hướng dẫn viên: xuống phía Nam theo làn đông, quay lại Bắc theo làn tây */
  const lane: [number, number, number][] = [
    [106.0, 21.6, 0.38], [105.4, 19.9, 0.22], [105.9, 18.4, 0.14], [106.7, 17.1, 0.12], [107.35, 16.35, 0.12],
    [108.2, 15.1, 0.12], [108.55, 13.7, 0.12], [108.55, 12.4, 0.14], [107.9, 11.3, 0.22], [106.8, 10.6, 0.32],
    [105.9, 9.8, 0.28], [105.5, 9.3, 0.15],
  ];
  const gpts = lane.map(([lo, la, w]) => {
    const p = P(lo, la);
    return new THREE.Vector3(p[0] + w, 0, p[1]);
  });
  {
    const e = P(105.5, 9.3);
    gpts.push(new THREE.Vector3(e[0], 0, e[1] + 0.15));
  }
  lane
    .slice()
    .reverse()
    .forEach(([lo, la, w]) => {
      const p = P(lo, la);
      gpts.push(new THREE.Vector3(p[0] - w, 0, p[1]));
    });
  {
    const e = P(106.0, 21.6);
    gpts.push(new THREE.Vector3(e[0], 0, e[1] - 0.3));
  }
  const gcurve = new THREE.CatmullRomCurve3(gpts, true);
  const gLen = gcurve.getLength();
  function gAt(s: number) {
    const u = (((s / gLen) % 1) + 1) % 1;
    const p = gcurve.getPointAt(u);
    const tg = gcurve.getTangentAt(u);
    return { x: p.x, z: p.z, yaw: Math.atan2(tg.x, tg.z) };
  }

  /* du khách đi theo sau hướng dẫn viên */
  const tourists: any[] = [];
  let tlI = 0;
  function tourist(c: any) {
    const o = new THREE.Group();
    o.scale.setScalar(c.s);
    scene.add(o);
    const inn = new THREE.Group();
    o.add(inn);
    const sh = M(c.shirt);
    const ht = M(c.hat);
    const tn = M(c.skin || 0xf2c9a5);
    const lg = [-1, 1].map((q) => {
      const g = new THREE.Group();
      g.position.set(q * 0.07, 0.38, 0);
      inn.add(g);
      mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), M(c.pants), 0, -0.19, 0, g);
      mesh(new THREE.SphereGeometry(0.07, 10, 8), dark, 0, -0.38, 0.03, g).scale.set(1, 0.6, 1.4);
      return g;
    });
    mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 16), sh, 0, 0.56, 0, inn);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), tn, 0, 0.76, 0, inn);
    mesh(new THREE.SphereGeometry(0.13, 20, 16), tn, 0, 0.88, 0, inn);
    [-1, 1].forEach((q) => mesh(new THREE.SphereGeometry(0.018, 8, 8), dark, q * 0.05, 0.89, 0.12, inn));
    mesh(new THREE.SphereGeometry(0.125, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), ht, 0, 0.92, 0, inn);
    if (c.hatType === "cap") mesh(new THREE.BoxGeometry(0.14, 0.012, 0.1), ht, 0, 0.925, 0.15, inn);
    else mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.012, 24), ht, 0, 0.93, 0, inn);
    const arm = (q: number) => {
      const g = new THREE.Group();
      g.position.set(q * 0.2, 0.7, 0);
      inn.add(g);
      mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.28, 10), sh, 0, -0.14, 0, g);
      mesh(new THREE.SphereGeometry(0.05, 10, 10), tn, 0, -0.3, 0, g);
      return g;
    };
    const aL = arm(-1);
    const aR = arm(1);
    if (c.pack) mesh(new THREE.BoxGeometry(0.22, 0.28, 0.1), M(c.pack), 0, 0.58, -0.17, inn);
    if (c.cam) mesh(new THREE.BoxGeometry(0.08, 0.055, 0.04), dark, 0, -0.33, 0.045, aR);
    mesh(
      new THREE.CircleGeometry(0.2, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
      0,
      0.012,
      0,
      o,
    ).rotation.x = -Math.PI / 2;
    tourists.push({ o, inn, lg, aL, aR, cam: !!c.cam, gap: c.gap, dr: c.dr, ph: c.ph, yaw: 0 });
    tourOnly.push(o);
  }
  [
    { shirt: 0x2f7bff, pants: 0x3b4a6b, hat: 0xffffff, hatType: "sun", s: 1.4, gap: 0.34, dr: 0.1, ph: 0, cam: 1 },
    { shirt: 0xff8fb1, pants: 0x5a4a6b, hat: 0xff6b4a, hatType: "cap", s: 1.4, gap: 0.62, dr: -0.12, ph: 1.1, pack: 0x2f8a4e, skin: 0xd9a77e },
    { shirt: 0x17c58a, pants: 0xc9a96a, hat: 0xffc83d, hatType: "sun", s: 1.1, gap: 0.88, dr: 0.1, ph: 2.2, pack: 0xe5483a },
    { shirt: 0xa06bff, pants: 0x2d3a4a, hat: 0x1b1420, hatType: "cap", s: 1.4, gap: 1.16, dr: -0.08, ph: 3.3, cam: 1, skin: 0xe3b48e },
  ].forEach(tourist);

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

  /* robot kiểu Jetbot (hiện khi chọn IT DevOps) */
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
    lights.push(
      mesh(
        new THREE.SphereGeometry(0.018, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfffa0, emissiveIntensity: 0.8 }),
        s * 0.17,
        0.14,
        0.185,
        jet,
      ),
    );
  });
  const cam3 = new THREE.Group();
  cam3.position.set(0, 0.3, 0.14);
  jet.add(cam3);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), gdark, 0, -0.03, 0, cam3);
  mesh(new THREE.BoxGeometry(0.09, 0.055, 0.05), gdark, 0, 0.025, 0, cam3);
  mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x2aa8ff, emissiveIntensity: 0.9 }),
    0,
    0.025,
    0.03,
    cam3,
  ).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6), gdark, -0.17, 0.33, -0.14, jet);
  mesh(new THREE.SphereGeometry(0.014, 8, 8), tipM, -0.17, 0.43, -0.14, jet);
  mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({ color: 0x76b900, transparent: true, opacity: 0.22 }),
    0,
    0.012,
    0,
    jet,
  ).rotation.x = -Math.PI / 2;

  /* đường chạy của robot: vòng tròn + nhánh vươn ra phía nội dung */
  const RC = 2.3;
  const AB = 3.0;
  const SG = 0.45;
  const NP = 720;
  const route: [number, number][] = [];
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
    ribbon = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ color: 0x76b900, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
    );
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

  /* đạo cụ (emoji) + biểu tượng liên hệ */
  function sprite(draw: (g: CanvasRenderingContext2D) => void, size: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    if (x) draw(x);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
    s.cvs = c;
    s.tex = t;
    s.scale.set(size, size, 1);
    scene.add(s);
    return s;
  }
  const props = [
    ["🗺️", -3.0, 2.9, -1.2],
    ["🧭", 3.0, 2.9, -1.0],
    ["📸", -3.3, 0.9, 1.8],
    ["🎒", 3.3, 0.9, 1.6],
  ].map(([em, x, y, z], i) => {
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
  const items: any[] = [];
  const hrefs: Record<string, string> = { phone: "#", mail: "#", fb: "#" };
  ["phone", "mail", "fb"].forEach((k, i) => {
    const s = sprite((x) => {
      const g = x.createLinearGradient(0, 0, 128, 128);
      g.addColorStop(0, COL[k as RowKind][0]);
      g.addColorStop(1, COL[k as RowKind][1]);
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
    s.userData = { href: hrefs[k], a: (i * Math.PI * 2) / 3 + 0.6 };
    items.push(s);
  });

  /* tương tác */
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  cv.parentNode?.appendChild(bubble);
  let hideT = 0;
  let hintT = 0;
  let msgI = 0;
  let tipI = 0;
  let wave = 0;
  let camD = 10.2;
  let camAz = 0;
  let camTarget = 0;
  let down: { x: number; y: number } | null = null;
  let ang = 0;
  let phase = 0;
  let mode: Mode = modeRef.current;

  function say(t: string) {
    bubble.textContent = t;
    bubble.classList.add("on");
    window.clearTimeout(hideT);
    hideT = window.setTimeout(() => bubble.classList.remove("on"), 3400);
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
    return ray.intersectObjects(items)[0];
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
  const nearTourist = (e: PointerEvent) => mode === "guide" && tourists.some((t) => near(t.o, 0.8, e, 40));

  const onPointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const hit = pickItem(e);
    const prop = !hit && pickProp(e);
    if (hit) {
      openHref(hit.object.userData.href);
    } else if (prop) {
      prop.object.userData.pulse = 1;
      const T = MODES[langRef.current][mode].tips;
      say(T[tipI++ % T.length]);
    } else if (near(mode === "dev" ? jet : guide, 0.8, e, 55)) {
      wave = 2.6;
      const G = MODES[langRef.current][mode].msgs(infoRef.current.name);
      say(G[msgI++ % G.length]);
    } else if (nearTourist(e)) {
      const TL = UI[langRef.current].tourists;
      say(TL[tlI++ % TL.length]);
    } else if (mode === "guide" && near(plane, 0, e, 45)) {
      say(UI[langRef.current].plane);
    } else if (mode === "dev" && sats.concat(evCars).some((o) => near(o, 0, e, 42))) {
      const ui = UI[langRef.current];
      say(Math.random() < 0.5 ? ui.satellite : ui.evCar);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor =
      pickItem(e) || pickProp(e) || near(mode === "dev" ? jet : guide, 0.8, e, 55) || nearTourist(e) || near(plane, 0, e, 45)
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
  ["pointerup", "pointercancel", "pointerleave"].forEach((n) => cv.addEventListener(n, resetPointer));
  hintT = window.setTimeout(() => say(UI[langRef.current].hint), 600);

  let modeT = 0;
  let modeTarget = 0;
  let popT = 0;
  function drawEmoji(s: any, em: string) {
    const g = s.cvs.getContext("2d");
    if (!g) return;
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
    isle.forEach((o: any) => (o.visible = m === "dev"));
    vn.visible = m === "guide";
    props.forEach((s: any, i: number) => drawEmoji(s, D.props[i]));
    const inf = infoRef.current;
    hrefs.phone = inf.phone;
    hrefs.mail = inf.email;
    hrefs.fb = inf.facebook;
    items.forEach((s: any, i: number) => (s.userData.href = [hrefs.phone, hrefs.mail, hrefs.fb][i]));
    sunBall.material.color.set(m === "dev" ? 0xdfe8ff : 0xffe27a);
    if (!initial) say(D.switchMsg);
  }

  function resize() {
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h) return;
    const cr = cardEl ? cardEl.getBoundingClientRect() : { width: 0, top: h, height: 0 };
    const wide = window.innerWidth >= 860;
    const visH = wide ? h : Math.max(160, cr.top - 40);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    const effW = wide ? w - cr.width * 0.5 : w;
    const effH = wide ? h : visH + (h - visH) * 0.45;
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
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    wave = Math.max(0, wave - dt);
    const walking = wave <= 0;
    if (walking) {
      ang += dt * 0.85;
      phase += dt * 7;
    }
    const gp = gAt(ang);
    guide.position.set(gp.x, walking ? Math.abs(Math.sin(phase)) * 0.03 : 0, gp.z);
    const want = walking
      ? gp.yaw
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
    /* du khách bám theo phía sau; khi hướng dẫn viên dừng lại, họ quay sang nghe và chụp ảnh */
    tourists.forEach((tt: any) => {
      const q = gAt(ang - tt.gap * 2.3);
      const p = tt.o.position;
      p.set(q.x, 0, q.z);
      const w = walking ? q.yaw : Math.atan2(guide.position.x - p.x, guide.position.z - p.z);
      let dd = w - tt.yaw;
      dd = Math.atan2(Math.sin(dd), Math.cos(dd));
      tt.yaw += dd * Math.min(1, dt * 6);
      tt.o.rotation.y = tt.yaw;
      const s = walking ? Math.sin(phase + tt.ph) : 0;
      const k = Math.min(1, dt * 14);
      tt.lg[0].rotation.x += (s * 0.7 - tt.lg[0].rotation.x) * k;
      tt.lg[1].rotation.x += (-s * 0.7 - tt.lg[1].rotation.x) * k;
      tt.aL.rotation.x += (-s * 0.6 - tt.aL.rotation.x) * k;
      const ar = tt.cam && !walking ? -1.4 : s * 0.6;
      tt.aR.rotation.x += (ar - tt.aR.rotation.x) * k;
      tt.inn.position.y = walking ? Math.abs(s) * 0.03 : 0;
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
      wheels.forEach((w: any) => (w.rotation.x = wheelRot));
      const att = stopped;
      lights.forEach((l: any) => (l.material.emissiveIntensity = att ? (Math.sin(t * 16) > 0 ? 2.2 : 0.3) : 0.8));
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
      g.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.6 + u.a) * 0.1, Math.sin(u.a) * u.r * 0.7 - 1);
    });
    const pa = t * 0.45;
    plane.position.set(Math.cos(pa) * 4.4, 3.0 + Math.sin(t * 1.1) * 0.2, Math.sin(pa) * 4.4);
    plane.rotation.y = Math.atan2(-Math.sin(pa), Math.cos(pa));
    props.forEach((s: any) => {
      const u = s.userData;
      u.pulse = Math.max(0, u.pulse - dt * 1.5);
      s.position.set(u.x, u.y + Math.sin(t * 1.4 + u.ph) * 0.12, u.z);
      const k = 0.9 * (1 + Math.sin(u.pulse * Math.PI) * 0.45);
      s.scale.set(k, k, 1);
    });
    items.forEach((s: any) => {
      const a = s.userData.a - t * 0.4;
      s.position.set(Math.cos(a) * 3.8, 1.9 + Math.sin(a * 1.3) * 0.4 + Math.sin(t * 1.3 + a) * 0.08, Math.sin(a) * 3.0);
    });
    modeT += (modeTarget - modeT) * Math.min(1, dt * 3);
    hemi.intensity = 1.05 - 0.3 * modeT;
    hemi.color.lerpColors(cDay, cNight, modeT);
    sun.intensity = 1.0 - 0.35 * modeT;
    sun.color.lerpColors(sDay, sNight, modeT);
    if (devScene.visible) {
      leds.forEach((l: any) => (l.material.emissiveIntensity = 0.3 + (Math.sin(t * 5 + l.userData.ph) > 0 ? 1.2 : 0)));
      dish.rotation.y = Math.sin(t * 0.5) * 0.8;
      sats.forEach((s: any) => {
        const o = s.userData.o;
        const a = o.ph + t * o.sp;
        s.position.set(Math.cos(a) * o.r, 2.6 + Math.sin(a) * o.r * Math.sin(o.tilt) * 0.5, Math.sin(a) * o.r * Math.cos(o.tilt));
        s.rotation.y = a * 0.5;
        s.userData.led.material.emissiveIntensity = Math.sin(t * 5 + o.ph) > 0.4 ? 2 : 0.2;
      });
      evCars.forEach((c: any) => {
        const o = c.userData.o;
        const a = o.ph + o.dir * t * o.sp;
        c.position.set(Math.cos(a) * o.R, o.y + Math.sin(t * 1.7 + o.ph) * 0.1, Math.sin(a) * o.R);
        c.rotation.y = o.dir > 0 ? Math.atan2(-Math.sin(a), Math.cos(a)) : Math.atan2(Math.sin(a), -Math.cos(a));
        c.rotation.z = -o.dir * 0.12;
        c.userData.glow.material.opacity = 0.35 + Math.sin(t * 6 + o.ph) * 0.1;
      });
      pipe.forEach((p: any, i: number) => {
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
    cam.position.set(Math.sin(az) * camD, ((3.6 + 5.4 * (1 - modeT)) * camD) / 10.2, Math.cos(az) * camD);
    cam.lookAt(0, 0.2, 0);
    renderer.render(scene, cam);
  }
  loop();

  return {
    setMode,
    cleanup: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(hideT);
      window.clearTimeout(hintT);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointerup", onPointerUp);
      cv.removeEventListener("pointermove", onPointerMove);
      ["pointerup", "pointercancel", "pointerleave"].forEach((n) => cv.removeEventListener(n, resetPointer));
      bubble.remove();
      renderer.dispose();
    },
  };
}
