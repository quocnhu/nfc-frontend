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
  displayUrl,
  formatRole,
  kindOf,
  loadThree,
  openHref,
} from "./template-utils";

type Lang = "vi" | "en";

const STRINGS = {
  vi: {
    role: "Diễn giả & Doanh nhân",
    bio: "Chia sẻ kỹ năng bán hàng và kinh nghiệm xây dựng kinh doanh từ những bước đầu tiên.",
    chips: ["Kỹ năng bán hàng", "Khởi nghiệp", "Xây dựng đội nhóm", "Tư duy kinh doanh", "Quản lý dòng tiền"],
    cta: "Mời tôi diễn thuyết",
    share: "Chia sẻ thẻ này",
    nfc: "Chạm điện thoại vào thẻ NFC để nhận liên hệ",
    copied: "Đã sao chép thông tin liên hệ",
    shared: "Đã chia sẻ",
    fail: "Không chia sẻ được, hãy thử lại",
    note: "Nội dung chia sẻ mang tính tham khảo. Kết quả kinh doanh phụ thuộc vào nhiều yếu tố và không có cam kết về thu nhập.",
    hint: "Chạm vào diễn giả, khán giả hoặc màn hình nhé!",
    msgs: (n: string) => [
      `Xin chào mọi người! Mình là ${n}.`,
      "Bán hàng bắt đầu từ việc lắng nghe khách hàng.",
      "Mỗi cuộc gặp là một cơ hội để học hỏi và cải thiện.",
      "Chạm vào các biểu tượng để liên hệ nhanh nhé!",
    ],
    tips: [
      "Hiểu rõ dòng tiền: biết tiền vào và tiền ra mỗi tháng.",
      "Theo dõi số liệu bán hàng đều đặn để biết điều gì đang hiệu quả.",
      "Xây dựng niềm tin: khách hàng mua từ người họ tin tưởng.",
      "Chọn đúng khách hàng mục tiêu thay vì bán cho tất cả mọi người.",
      "Kiên trì và cải thiện mỗi ngày: kỹ năng bán hàng có thể rèn luyện.",
    ],
    screen: "Biểu đồ minh họa: hãy theo dõi số liệu của bạn mỗi ngày.",
    cheer: "Cảm ơn mọi người đã lắng nghe!",
    screenTitle: "DOANH SỐ",
    screenTag: "MINH HỌA",
  },
  en: {
    role: "Speaker & Entrepreneur",
    bio: "Sharing sales skills and lessons from building a business, from the very first steps.",
    chips: ["Sales skills", "Startups", "Team building", "Business mindset", "Cash-flow basics"],
    cta: "Book me to speak",
    share: "Share this card",
    nfc: "Tap your phone on the NFC tag to receive this contact",
    copied: "Contact details copied",
    shared: "Shared",
    fail: "Could not share, please try again",
    note: "Content is shared for reference only. Business results depend on many factors and no income is promised or guaranteed.",
    hint: "Tap the speaker, the audience or the screen!",
    msgs: (n: string) => [
      `Hello everyone! I'm ${n}.`,
      "Selling starts with listening to your customer.",
      "Every meeting is a chance to learn and improve.",
      "Tap the icons to get in touch quickly!",
    ],
    tips: [
      "Know your cash flow: how much comes in and goes out each month.",
      "Track your sales numbers regularly to see what really works.",
      "Build trust: people buy from those they trust.",
      "Pick the right target customer instead of selling to everyone.",
      "Stay consistent and improve daily: sales skills can be trained.",
    ],
    screen: "Illustrative chart: track your own numbers every day.",
    cheer: "Thank you all for listening!",
    screenTitle: "SALES",
    screenTag: "ILLUSTRATION",
  },
};

const AVATAR_SVG = `<svg viewBox="0 0 100 100" role="img" aria-label="Speaker avatar"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a42c8"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag)"/><path d="M10 100c2-22 16-31 40-31s38 9 40 31z" fill="#1b2340"/><path d="M40 70l10 14 10-14z" fill="#fff"/><path d="M48 74h4l2 10-4 4-4-4z" fill="#ff9f1c"/>
<rect x="44" y="58" width="12" height="14" rx="5" fill="#f0c4a0"/><circle cx="50" cy="45" r="21" fill="#f6cfae"/><path d="M29 44a21 20 0 0 1 42 0v-4c0-12-9-20-21-20s-21 8-21 20z" fill="#1c1512"/>
<circle cx="42" cy="50" r="2.5" fill="#2a1a12"/><circle cx="58" cy="50" r="2.5" fill="#2a1a12"/><path d="M42 58q8 7 16 0" fill="none" stroke="#2a1a12" stroke-width="2.4" stroke-linecap="round"/>
<path d="M28 46a22 22 0 0 1 44 0" fill="none" stroke="#14111f" stroke-width="3" stroke-linecap="round"/><rect x="24" y="44" width="6" height="12" rx="3" fill="#14111f"/><path d="M27 56q4 10 18 8" fill="none" stroke="#14111f" stroke-width="2"/><circle cx="46" cy="64" r="2.4" fill="#14111f"/></svg>`;

const CSS = `
.sp-template{--brand:#ff9f1c;--gold:#ffd166;--bg:#120a2b;--card:rgba(26,14,60,.82);--line:rgba(190,160,255,.28);--text:#f5f0ff;--muted:#b7a8dc;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif}
.sp-template *{box-sizing:border-box;margin:0}
@media (prefers-color-scheme:light){.sp-template{--bg:#f6f2ff;--card:rgba(255,255,255,.88);--line:rgba(90,50,170,.25);--text:#1b1040;--muted:#62559a;--gold:#a35f00}}
.sp-template .stage{position:fixed;inset:0;background:radial-gradient(circle at 50% 18%,#4a2c93 0,#241552 50%,#0f0826 100%)}
.sp-template #gl{width:100%;height:100%;display:block;touch-action:none}
.sp-template .top{position:absolute;z-index:4;left:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,50,30,.5)}
.sp-template .top button{border:0;background:transparent;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#2a1760}
.sp-template .top button.on{background:var(--brand);color:#fff}
.sp-template .top button:focus-visible{outline:2px solid #0a5a34;outline-offset:2px}
.sp-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:250px;padding:9px 13px;border-radius:14px;background:#fff;color:#1b1040;font-size:13.5px;font-weight:500;line-height:1.4;text-align:center;box-shadow:0 6px 18px -8px rgba(0,50,30,.55);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.sp-template .bubble.on{opacity:1;transform:translateX(-50%)}
.sp-template .card{position:fixed;z-index:5;left:0;right:0;bottom:0;max-height:50vh;max-height:50dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,60,30,.55);transition:max-height .35s ease}
.sp-template .card.min{max-height:225px}
.sp-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.sp-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid var(--bg);background:#fff;box-shadow:0 8px 22px -8px rgba(0,0,0,.5)}
.sp-template .avatar svg,.sp-template .avatar img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.sp-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.sp-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.sp-template .card.min .fold svg{transform:rotate(180deg)}
.sp-template .fold:focus-visible,.sp-template .btn:focus-visible,.sp-template a.row:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.sp-template .who{text-align:center}
.sp-template .co{display:inline-block;padding:2px 12px;border-radius:999px;background:color-mix(in srgb,var(--brand) 22%,transparent);border:1px solid var(--line);font-size:12.5px;font-weight:700;letter-spacing:.2px}
.sp-template h1{margin-top:6px;font-size:25px;font-weight:800;line-height:1.2}
.sp-template .role{margin-top:2px;color:var(--gold);font-size:15.5px;font-weight:700}
.sp-template .bio{margin:7px auto 0;max-width:36ch;color:var(--muted);font-size:14px;line-height:1.5}
.sp-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.sp-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:12.5px;font-weight:600;background:color-mix(in srgb,var(--brand) 14%,transparent)}
.sp-template .rows{display:grid;gap:10px;margin-top:16px}
.sp-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.sp-template a.row:hover,.sp-template a.row:active{border-color:var(--gold);transform:translateY(-1px)}
.sp-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px}
.sp-template .ico svg{width:19px;height:19px;fill:currentColor}
.sp-template .ico img{width:24px;height:24px;object-fit:contain}
.sp-template .row small{display:block;color:var(--muted);font-size:12px;line-height:1.2}
.sp-template .row span{font-size:15px;font-weight:600;line-height:1.3;word-break:break-word}
.sp-template .btn{display:block;width:100%;margin-top:14px;padding:12px;border:0;border-radius:16px;font:inherit;font-weight:800;font-size:15.5px;text-align:center;text-decoration:none;cursor:pointer;color:#fff;background:linear-gradient(90deg,var(--brand),color-mix(in srgb,var(--brand) 55%,#7fd36b))}
.sp-template .btn.ghost{margin-top:10px;background:transparent;color:var(--text);border:1px solid var(--line);font-weight:700}
.sp-template .toast{margin-top:8px;text-align:center;font-size:13px;color:var(--gold);min-height:19px}
.sp-template .nfc{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:var(--muted);margin-top:4px}
.sp-template .nfc i{width:8px;height:8px;border-radius:50%;background:var(--gold);animation:sp-pulse 2s infinite}
@keyframes sp-pulse{0%{box-shadow:0 0 0 0 var(--gold)}70%,100%{box-shadow:0 0 0 10px transparent}}
.sp-template .note{margin-top:10px;text-align:center;font-size:11.5px;line-height:1.5;color:var(--muted)}
@media (min-width:860px){
.sp-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,60,30,.55)}
.sp-template .card.min{max-height:none}
.sp-template .avatar{position:relative;top:auto;left:auto;margin:30px 0 0 24px}
.sp-template .scroll{padding:14px 24px 28px;flex:1}
.sp-template .fold{display:none}
.sp-template .bubble{left:calc((100% - var(--panel))/2)}
.sp-template .nfc{justify-content:flex-start}
.sp-template .who{text-align:left}.sp-template .bio{margin-left:0}.sp-template .chips{justify-content:flex-start}.sp-template h1{font-size:31px}.sp-template .note{text-align:left}
}
@media (prefers-reduced-motion:reduce){.sp-template .nfc i{animation:none}.sp-template .card{transition:none}}
`;

interface Info {
  brand: string;
  name: string;
  phone: string;
  email: string;
  facebook: string;
  phoneText: string;
  emailText: string;
}

export default function SpeakerTemplate({ user, items }: TemplateProps) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const hash = window.location.hash.slice(1);
    if (hash === "vi" || hash === "en") return hash;
    return (navigator.language || "").toLowerCase().startsWith("vi") ? "vi" : "en";
  });
  const [folded, setFolded] = useState(false);
  const [toast, setToast] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<Lang>(lang);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "vi" || hash === "en") setLang(hash);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    const prev = document.title;
    document.title = `${user.fullname} · ${formatRole(user.role?.name)}`;
    return () => {
      document.title = prev;
    };
  }, [lang, user.fullname, user.role?.name]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const roleLabel = formatRole(user.role?.name);

  const rows = useMemo<Row[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        kind: kindOf(item),
        label: item.itemName,
        text: displayUrl(item.url),
        href: item.url || undefined,
        iconUrl: item.iconUrl,
      })),
    [items],
  );

  const info = useMemo<Info>(() => {
    const find = (k: Row["kind"]) => rows.find((r) => r.kind === k);
    const phone = find("phone")?.href ?? "";
    const email = find("mail")?.href ?? "";
    return {
      brand: "#ff9f1c",
      name: user.fullname,
      phone,
      email,
      facebook: find("fb")?.href ?? "",
      phoneText: displayUrl(phone),
      emailText: displayUrl(email),
    };
  }, [rows, user.fullname]);

  const infoRef = useRef(info);
  useEffect(() => {
    infoRef.current = info;
  }, [info]);

  const avatarSrc = useMemo(() => {
    if (user.avatarUrl) return user.avatarUrl;
    return `data:image/svg+xml;utf8,${encodeURIComponent(AVATAR_SVG)}`;
  }, [user.avatarUrl]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    loadThree()
      .then((THREE) => {
        if (disposed || !THREE || !canvasRef.current) return;
        cleanup = setupScene(THREE, canvasRef.current, cardRef.current, stageRef.current, langRef, infoRef);
      })
      .catch(() => {
        // 3D is decorative; the card panel still works without it.
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  const s = STRINGS[lang];

  const onShare = async () => {
    const data = { title: user.fullname, text: `${user.fullname} – ${roleLabel}`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
        setToast(s.shared);
      } else {
        await navigator.clipboard.writeText(`${user.fullname}\n${roleLabel} · ${s.role}\n${info.phoneText}\n${info.emailText}`);
        setToast(s.copied);
      }
    } catch {
      setToast(s.fail);
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const bookHref = info.phone || info.email || "#";

  return (
    <div className="sp-template">
      <style>{CSS}</style>

      <div className="stage" ref={stageRef}>
        <div className="top" role="tablist" aria-label="Language">
          <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>VI</button>
          <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <canvas ref={canvasRef} id="gl" aria-label="3D scene: an entrepreneur speaking on stage in front of a large audience, with a growing sales chart on the screen" />
      </div>

      <main className={`card${folded ? " min" : ""}`} ref={cardRef}>
        <div className="avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt={user.fullname} />
        </div>
        <button className="fold" type="button" aria-label="Collapse or expand" onClick={() => setFolded((v) => !v)}>
          <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
        </button>
        <div className="scroll">
          <section className="who">
            <span className="co">{roleLabel}</span>
            <h1>{user.fullname}</h1>
            <p className="role">{s.role}</p>
            <p className="bio">{s.bio}</p>
            <div className="chips">
              {s.chips.map((c) => <span className="chip" key={c}>{c}</span>)}
            </div>
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
                    ) : PATHS[row.kind] ? (
                      <svg viewBox="0 0 24 24"><path d={PATHS[row.kind]} /></svg>
                    ) : (
                      <span aria-hidden>{EMOJI[row.kind]}</span>
                    )}
                  </div>
                  <div><small>{row.label}</small><span>{row.text}</span></div>
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

          <a className="btn" href={bookHref}>{s.cta}</a>
          <button className="btn ghost" type="button" onClick={onShare}>{s.share}</button>
          <p className="toast" role="status">{toast}</p>
          <p className="nfc"><i /><span>{s.nfc}</span></p>
          <p className="note">{s.note}</p>
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
  infoRef: React.MutableRefObject<Info>,
): () => void {
  const cv = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a4aa0, 0.95));
  const key = new THREE.DirectionalLight(0xfff0d0, 0.9);
  key.position.set(3, 7, 6);
  scene.add(key);

  const brand = new THREE.Color(infoRef.current.brand);
  const G = -1.3;
  const SY = G + 0.34;
  const BASE = 11.6;

  const M = (c: any, o: any = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.65, metalness: 0.05 }, o));
  const mesh = (geo: any, mat: any, x?: number, y?: number, z?: number, parent?: any) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x || 0, y || 0, z || 0);
    (parent || scene).add(o);
    return o;
  };
  const box = (w: number, h: number, d: number, c: any, x: number, y: number, z: number, p?: any) =>
    mesh(new THREE.BoxGeometry(w, h, d), M(c), x, y, z, p);

  /* floor, aisle, stage */
  mesh(new THREE.PlaneGeometry(8.6, 7.6), M(0x1d1546, { roughness: 0.9 }), 0, G, -0.4).rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(0.7, 5.2), M(brand, { roughness: 0.7, emissive: brand, emissiveIntensity: 0.15 }), 0, G + 0.004, 0.9).rotation.x = -Math.PI / 2;
  box(6.8, 0.34, 2.4, 0x2a2058, 0, G + 0.17, -2.5);
  mesh(new THREE.BoxGeometry(6.8, 0.05, 0.04), new THREE.MeshStandardMaterial({ color: brand, emissive: brand, emissiveIntensity: 1 }), 0, G + 0.3, -1.28);

  /* LED screen with animated sales chart */
  box(5.3, 2.55, 0.14, 0x0e0a22, 0, SY + 1.5, -3.62);
  const sc = document.createElement("canvas");
  sc.width = 512;
  sc.height = 236;
  const sx = sc.getContext("2d");
  const stex = new THREE.CanvasTexture(sc);
  stex.encoding = THREE.sRGBEncoding;
  const screen = mesh(new THREE.PlaneGeometry(5.0, 2.3), new THREE.MeshBasicMaterial({ map: stex }), 0, SY + 1.5, -3.54);

  function drawScreen(p: number) {
    if (!sx) return;
    const S = STRINGS[langRef.current];
    const W = 512;
    const H = 236;
    const g = sx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1b1342");
    g.addColorStop(1, "#0c0826");
    sx.fillStyle = g;
    sx.fillRect(0, 0, W, H);
    sx.strokeStyle = "rgba(180,160,255,.15)";
    sx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      sx.beginPath();
      sx.moveTo(0, (i * H) / 6);
      sx.lineTo(W, (i * H) / 6);
      sx.stroke();
    }
    [0.25, 0.32, 0.4, 0.38, 0.55, 0.62, 0.78, 0.95].forEach((v, i) => {
      const f = Math.min(1, Math.max(0, p * 1.4 - i * 0.08));
      const bh = v * 150 * f;
      sx.fillStyle = i % 2 ? "#ffd166" : infoRef.current.brand;
      sx.fillRect(40 + i * 52, 205 - bh, 34, bh);
    });
    sx.strokeStyle = "#fff";
    sx.lineWidth = 4;
    sx.lineJoin = "round";
    sx.beginPath();
    let last: [number, number] | null = null;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      if (u > p) break;
      const x = 50 + u * 410;
      const y = 190 - Math.pow(u, 1.6) * 140 - Math.sin(u * 9) * 6;
      if (i === 0) sx.moveTo(x, y);
      else sx.lineTo(x, y);
      last = [x, y];
    }
    sx.stroke();
    if (last) {
      sx.fillStyle = "#ffd166";
      sx.beginPath();
      sx.arc(last[0], last[1], 7, 0, 7);
      sx.fill();
    }
    sx.fillStyle = "#fff";
    sx.font = "700 26px sans-serif";
    sx.textAlign = "left";
    sx.fillText(S.screenTitle, 22, 36);
    sx.font = "600 15px sans-serif";
    sx.fillStyle = "#b7a8dc";
    sx.textAlign = "right";
    sx.fillText(S.screenTag, W - 18, 30);
    sx.fillStyle = "#ffd166";
    sx.font = "800 40px sans-serif";
    sx.fillText(`+${Math.round(p * 180)}%`, W - 18, 76);
    stex.needsUpdate = true;
  }

  let chartP = 0;
  let chartBoost = 0;
  let scrT = 0;

  [-1, 1].forEach((s) => {
    const c = mesh(
      new THREE.ConeGeometry(1.0, 3.6, 28, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe8a8, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      s * 1.9,
      SY + 2.1,
      -2.4,
    );
    c.rotation.z = -s * 0.28;
  });

  /* people */
  function makePerson(o: any) {
    const g = new THREE.Group();
    g.scale.setScalar(o.s);
    scene.add(g);
    const skin = M(o.skin || 0xf2c9a5);
    const shirt = M(o.shirt);
    const pants = M(o.pants || 0x151b30);
    const dark = M(0x14111f, { roughness: 0.4 });
    const hairM = M(o.hairC || 0x1c1512, { roughness: 0.85 });
    const legs = [-1, 1].map((s) => {
      const l = new THREE.Group();
      l.position.set(s * 0.07, 0.38, 0);
      g.add(l);
      mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 10), pants, 0, -0.19, 0, l);
      mesh(new THREE.SphereGeometry(0.07, 10, 8), dark, 0, -0.38, 0.03, l).scale.set(1, 0.6, 1.4);
      return l;
    });
    mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 16), shirt, 0, 0.56, 0, g);
    mesh(new THREE.BoxGeometry(0.1, 0.3, 0.01), M(0xffffff), 0, 0.58, 0.162, g);
    mesh(new THREE.BoxGeometry(0.04, 0.22, 0.012), M(brand), 0, 0.55, 0.168, g);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), skin, 0, 0.76, 0, g);
    const head = new THREE.Group();
    head.position.set(0, 0.88, 0);
    g.add(head);
    mesh(new THREE.SphereGeometry(0.13, 20, 16), skin, 0, 0, 0, head);
    mesh(new THREE.SphereGeometry(0.137, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, 0, 0.005, -0.004, head);
    [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.018, 8, 8), dark, s * 0.05, 0.01, 0.12, head));
    mesh(new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI), dark, 0, -0.025, 0.122, head).rotation.z = Math.PI;
    mesh(new THREE.TorusGeometry(0.14, 0.008, 6, 20, Math.PI), dark, 0, 0, 0, head);
    mesh(new THREE.SphereGeometry(0.03, 10, 10), dark, 0.14, -0.01, 0, head);
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 6), dark, 0.09, -0.02, 0.065, head).rotation.set(0, 0.93, Math.PI / 2);
    mesh(new THREE.SphereGeometry(0.013, 8, 8), M(brand, { emissive: brand, emissiveIntensity: 0.7 }), 0.045, -0.03, 0.12, head);
    function garm(s: number) {
      const a = new THREE.Group();
      a.position.set(s * 0.2, 0.7, 0);
      g.add(a);
      mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.28, 10), shirt, 0, -0.14, 0, a);
      mesh(new THREE.SphereGeometry(0.05, 10, 10), skin, 0, -0.3, 0, a);
      return a;
    }
    mesh(new THREE.CircleGeometry(0.2, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }), 0, 0.012, 0, g).rotation.x = -Math.PI / 2;
    return { g, legs, armL: garm(-1), armR: garm(1), head };
  }

  const spk = makePerson({ s: 1.85, shirt: 0x1b2340, skin: 0xf0c8a4 });
  let paceA = 0;
  let phase = 0;
  let spkWave = 0;
  let cheer = 0;
  let msgI = 0;

  const SKIN = [0xf0c8a4, 0xe8b88f, 0xf6d3b8, 0xc99a74, 0xdcb08a].map((c) => M(c));
  const TOP = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x14b8a6, 0x64748b, 0xf97316, 0x22c55e].map((c) => M(c));
  const HAIR = [0x1c1512, 0x3b2a20, 0x5a3a22, 0x8a6a3a, 0x222222, 0xb08a4a].map((c) => M(c, { roughness: 0.9 }));
  const chairM = M(0x2a2250, { roughness: 0.9 });
  const phoneM = M(0x14111f);
  const screenM = new THREE.MeshBasicMaterial({ color: 0xaed6ff });
  const audience: any[] = [];

  function aud(x: number, z: number, i: number) {
    const g = new THREE.Group();
    g.position.set(x, G, z);
    g.rotation.y = Math.PI;
    g.scale.setScalar(1.3);
    scene.add(g);
    mesh(new THREE.BoxGeometry(0.34, 0.3, 0.05), chairM, 0, 0.16, -0.16, g);
    const top = TOP[(i * 7) % TOP.length];
    const skin = SKIN[i % 5];
    mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.3, 10), top, 0, 0.3, 0, g);
    const head = new THREE.Group();
    head.position.set(0, 0.55, 0);
    g.add(head);
    mesh(new THREE.SphereGeometry(0.1, 12, 10), i % 9 === 0 ? skin : HAIR[(i * 3) % HAIR.length], 0, 0, 0, head);
    mesh(new THREE.SphereGeometry(0.082, 10, 8), skin, 0, -0.01, 0.05, head);
    function arm(s: number) {
      const a = new THREE.Group();
      a.position.set(s * 0.17, 0.42, 0);
      g.add(a);
      mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.24, 8), top, 0, -0.12, 0, a);
      mesh(new THREE.SphereGeometry(0.04, 8, 8), skin, 0, -0.26, 0, a);
      a.rotation.z = s * 0.15;
      return a;
    }
    const L = arm(-1);
    const R = arm(1);
    const mode = i % 5 === 1 ? "phone" : i % 7 === 3 ? "hand" : "none";
    if (mode === "phone") {
      const ph = new THREE.Group();
      ph.position.set(0, -0.3, 0.05);
      R.add(ph);
      mesh(new THREE.BoxGeometry(0.055, 0.095, 0.012), phoneM, 0, 0, 0, ph);
      mesh(new THREE.PlaneGeometry(0.045, 0.08), screenM, 0, 0, 0.007, ph);
    }
    audience.push({ g, head, L, R, mode });
  }

  let ai = 0;
  ([[-0.45, 4], [0.35, 5], [1.15, 5], [1.95, 6]] as any[]).forEach(([z, n]) => {
    [-1, 1].forEach((side) => {
      for (let j = 0; j < n; j++) aud(side * (0.6 + j * 0.52), z, ai++);
    });
  });

  /* confetti */
  const CN = 140;
  const cp = new Float32Array(CN * 3);
  const cc = new Float32Array(CN * 3);
  const CCOL = [new THREE.Color(infoRef.current.brand), new THREE.Color(0xffd166), new THREE.Color(0xffffff), new THREE.Color(0xff6b9a), new THREE.Color(0x6fe0ff)];
  for (let i = 0; i < CN; i++) {
    const c = CCOL[i % 5];
    cc.set([c.r, c.g, c.b], i * 3);
    cp.set([0, -9, 0], i * 3);
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute("position", new THREE.BufferAttribute(cp, 3));
  cg.setAttribute("color", new THREE.BufferAttribute(cc, 3));
  const confM = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0 });
  scene.add(new THREE.Points(cg, confM));

  function startCheer() {
    cheer = 3.2;
    for (let i = 0; i < CN; i++) cg.attributes.position.setXYZ(i, (Math.random() - 0.5) * 6.4, 2.5 + Math.random() * 2.5, -3 + Math.random() * 5.5);
    cg.attributes.position.needsUpdate = true;
  }

  /* icons: tips + contact */
  function sprite(draw: (g: CanvasRenderingContext2D) => void, size: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    if (x) draw(x);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
    s.scale.set(size, size, 1);
    scene.add(s);
    return s;
  }

  const propSprites = (([["💰", -3.4, 2.9, -1.6], ["📈", 3.4, 2.9, -1.7], ["🤝", -3.5, 1.0, 1.4], ["🎯", 3.5, 1.0, 1.5], ["🔥", -1.7, 3.5, -2.2]] as any[])).map(([em, x, y, z], i) => {
    const s = sprite((g) => {
      g.fillStyle = "rgba(255,255,255,.9)";
      g.beginPath();
      g.arc(64, 64, 58, 0, 7);
      g.fill();
      g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(em, 64, 70);
    }, 0.9);
    s.userData = { x, y, z, ph: i * 1.7, pulse: 0, i };
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

  /* interaction */
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  (stageEl || cv.parentNode)?.appendChild(bubble);
  let hideT: ReturnType<typeof setTimeout> | undefined;
  let camD = 11;
  let camAz = 0;
  let camTarget = 0;
  let down: { x: number; y: number } | null = null;

  function say(t: string) {
    bubble.textContent = t;
    bubble.classList.add("on");
    if (hideT) clearTimeout(hideT);
    hideT = setTimeout(() => bubble.classList.remove("on"), 3600);
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
    return ray.intersectObjects(propSprites)[0];
  };
  const pickScreen = (e: PointerEvent) => {
    setRay(e);
    return ray.intersectObject(screen)[0];
  };

  function near(obj: any, dy: number, e: PointerEvent, rad: number) {
    const r = cv.getBoundingClientRect();
    obj.getWorldPosition(tmp);
    tmp.y += dy;
    const p = tmp.project(cam);
    return Math.hypot(e.clientX - (r.left + (p.x * 0.5 + 0.5) * r.width), e.clientY - (r.top + (-p.y * 0.5 + 0.5) * r.height)) < rad;
  }

  const nearSpk = (e: PointerEvent) => near(spk.g, 1.0, e, 72);
  const nearAud = (e: PointerEvent) => audience.some((a) => near(a.g, 0.5, e, 34));

  const onPointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const S = STRINGS[langRef.current];
    const hit = pickItem(e);
    const prop = hit ? undefined : pickProp(e);
    if (hit) {
      const u = hit.object.userData.href;
      if (u) openHref(u);
    } else if (prop) {
      prop.object.userData.pulse = 1;
      say(S.tips[prop.object.userData.i % S.tips.length]);
    } else if (nearSpk(e)) {
      spkWave = 2.6;
      const msgs = S.msgs(infoRef.current.name);
      say(msgs[msgI++ % msgs.length]);
    } else if (pickScreen(e)) {
      chartP = 0;
      chartBoost = 1;
      say(S.screen);
    } else if (nearAud(e)) {
      startCheer();
      say(S.cheer);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor = pickItem(e) || pickProp(e) || nearSpk(e) || pickScreen(e) || nearAud(e) ? "pointer" : "default";
    if (down) camTarget = Math.max(-1.1, Math.min(1.1, (e.clientX - down.x) * 0.008));
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
  const hintT = setTimeout(() => say(STRINGS[langRef.current].hint), 700);

  function resize() {
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cr = cardEl ? cardEl.getBoundingClientRect() : { width: 0, top: h, height: 0 };
    const wide = window.innerWidth >= 860;
    const visW = wide ? w - cr.width : w;
    const visH = wide ? h : Math.max(160, cr.top - 40);
    const effW = wide ? visW * 1.05 : w;
    const effH = wide ? h : visH * 1.12;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    camD = Math.max(10.5, (BASE * h) / Math.min(effW, effH));
    cam.setViewOffset(w, h, wide ? cr.width * 0.5 : 0, wide ? 0 : (h - visH) * 0.5 + 16, w, h);
    cam.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  if (cardEl) ro.observe(cardEl);
  resize();

  const clock = new THREE.Clock();
  const ease = (o: any, k: string, v: number, dt: number, sp?: number) => {
    const q = k.split(".");
    const tg = q.length > 1 ? o[q[0]] : o;
    const key = q[q.length - 1];
    tg[key] += (v - tg[key]) * Math.min(1, dt * (sp || 10));
  };

  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    spkWave = Math.max(0, spkWave - dt);
    cheer = Math.max(0, cheer - dt);
    chartBoost = Math.max(0, chartBoost - dt * 0.5);
    chartP += dt * 0.2 * (1 + chartBoost * 3);
    if (chartP > 1.5) chartP = 0;
    scrT -= dt;
    if (scrT <= 0) {
      scrT = 0.06;
      drawScreen(Math.min(1, chartP));
    }

    const emote = spkWave > 0 || cheer > 0;
    if (!emote) paceA += dt * 0.35;
    const vx = Math.cos(paceA) * 1.5 * 0.35;
    const mv = emote ? 0 : Math.min(1, Math.abs(vx) * 1.6);
    phase += dt * 7 * mv;
    const sw = Math.sin(phase) * mv;
    spk.g.position.set(Math.sin(paceA) * 1.5, SY + (mv > 0 ? Math.abs(Math.sin(phase)) * 0.02 : 0), -2.45);
    ease(spk.g.rotation, "y", emote ? 0 : Math.max(-0.7, Math.min(0.7, vx * 1.2)), dt, 5);
    ease(spk.legs[0], "rotation.x", sw * 0.6, dt, 14);
    ease(spk.legs[1], "rotation.x", -sw * 0.6, dt, 14);
    const R = spk.armR;
    const L = spk.armL;
    if (emote) {
      ease(R, "rotation.z", 2.3 + Math.sin(t * 10) * 0.3, dt);
      ease(L, "rotation.z", -(2.3 + Math.sin(t * 10 + 1) * 0.3), dt);
      ease(R, "rotation.x", 0, dt);
      ease(L, "rotation.x", 0, dt);
    } else {
      ease(R, "rotation.z", 0.5 + Math.sin(t * 2.2) * 0.35, dt);
      ease(R, "rotation.x", -0.4 + Math.sin(t * 1.7) * 0.35, dt);
      ease(L, "rotation.z", -(0.35 + Math.sin(t * 1.9 + 1) * 0.3), dt);
      ease(L, "rotation.x", -0.3 + Math.sin(t * 1.5 + 2) * 0.3, dt);
    }

    const ch = cheer > 0;
    audience.forEach((a, i) => {
      a.head.rotation.y = Math.sin(t * 0.8 + i) * 0.25;
      a.head.rotation.x = ch ? Math.sin(t * 12 + i) * 0.12 : Math.sin(t * 1.2 + i * 0.7) * 0.05;
      a.g.position.y = G + (ch ? Math.abs(Math.sin(t * 9 + i)) * 0.05 : 0);
      const AR = a.R;
      const AL = a.L;
      if (ch) {
        if (i % 2) {
          ease(AR, "rotation.z", 2.6 + Math.sin(t * 12 + i) * 0.3, dt, 12);
          ease(AL, "rotation.z", -(2.6 + Math.sin(t * 12 + i + 1) * 0.3), dt, 12);
          ease(AR, "rotation.x", 0, dt, 12);
          ease(AL, "rotation.x", 0, dt, 12);
        } else {
          ease(AR, "rotation.x", -1.2 + Math.sin(t * 14 + i) * 0.12, dt, 12);
          ease(AL, "rotation.x", -1.2 - Math.sin(t * 14 + i) * 0.12, dt, 12);
          ease(AR, "rotation.z", -0.3, dt, 12);
          ease(AL, "rotation.z", 0.3, dt, 12);
        }
      } else if (a.mode === "phone") {
        ease(AR, "rotation.x", -1.9 + Math.sin(t * 1.5 + i) * 0.05, dt);
        ease(AR, "rotation.z", -0.12, dt);
        ease(AL, "rotation.x", 0, dt);
        ease(AL, "rotation.z", -0.15, dt);
      } else if (a.mode === "hand" && Math.sin(t * 0.4 + i * 2) > 0.88) {
        ease(AR, "rotation.z", 2.7, dt);
        ease(AR, "rotation.x", 0, dt);
        ease(AL, "rotation.z", -0.15, dt);
      } else {
        ease(AR, "rotation.z", 0.15, dt);
        ease(AR, "rotation.x", 0, dt);
        ease(AL, "rotation.z", -0.15, dt);
        ease(AL, "rotation.x", 0, dt);
      }
    });

    if (ch) {
      const pa = cg.attributes.position;
      for (let i = 0; i < CN; i++) {
        let y = pa.getY(i) - dt * (1.1 + (i % 5) * 0.15);
        if (y < G) y = G;
        pa.setY(i, y);
        pa.setX(i, pa.getX(i) + Math.sin(t * 3 + i) * 0.004);
      }
      pa.needsUpdate = true;
    }
    confM.opacity = Math.min(1, cheer);

    propSprites.forEach((s) => {
      const u = s.userData;
      u.pulse = Math.max(0, u.pulse - dt * 1.5);
      s.position.set(u.x, u.y + Math.sin(t * 1.4 + u.ph) * 0.12, u.z);
      const k = 0.9 * (1 + Math.sin(u.pulse * Math.PI) * 0.45);
      s.scale.set(k, k, 1);
    });

    contactItems.forEach((s) => {
      const a = s.userData.a - t * 0.4;
      s.position.set(Math.cos(a) * 3.9, 0.9 + Math.sin(a * 1.3) * 0.5 + Math.sin(t * 1.3 + a) * 0.08, Math.sin(a) * 2.3 - 0.2);
    });

    camAz += (camTarget - camAz) * Math.min(1, dt * 5);
    const az = camAz + Math.sin(t * 0.25) * 0.05;
    cam.position.set(Math.sin(az) * camD, (3.4 * camD) / BASE, Math.cos(az) * camD);
    cam.lookAt(0, 0.3, -0.6);
    renderer.render(scene, cam);
  }
  loop();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    if (hideT) clearTimeout(hideT);
    clearTimeout(hintT);
    cv.removeEventListener("pointerdown", onPointerDown);
    cv.removeEventListener("pointerup", onPointerUp);
    cv.removeEventListener("pointermove", onPointerMove);
    cv.removeEventListener("pointerup", resetPointer);
    cv.removeEventListener("pointercancel", resetPointer);
    cv.removeEventListener("pointerleave", resetPointer);
    bubble.remove();
    renderer.dispose();
  };
}
