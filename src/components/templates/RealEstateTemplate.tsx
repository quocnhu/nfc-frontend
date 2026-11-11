"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- three.js is loaded from
   a CDN at runtime and has no bundled types; the imperative scene code is
   ported from the standalone template and uses dynamic three objects. */

import React, { useEffect, useMemo, useRef, useState } from "react";

interface TemplateItem {
  id: string;
  url: string;
  itemName: string;
  icon: string;
  iconUrl?: string;
}

interface Props {
  user: {
    fullname: string;
    avatarUrl?: string;
    email: string;
    role?: { id: string; name: string };
  };
  items: TemplateItem[];
}

type Lang = "vi" | "en";
type RowKind = "phone" | "mail" | "fb" | "zalo" | "pin" | "clock" | "lic" | "link";

interface Row {
  id: string;
  kind: RowKind;
  label: string;
  text: string;
  href?: string;
  iconUrl?: string;
}

const COL: Record<RowKind, [string, string]> = {
  phone: ["#17c58a", "#0b8f68"],
  mail: ["#8a5cff", "#5b34d6"],
  fb: ["#2f7bff", "#1a4fd0"],
  zalo: ["#2d8cff", "#0a5fd0"],
  pin: ["#ff8a4a", "#e5501a"],
  clock: ["#14b8c8", "#0a8494"],
  lic: ["#c99a22", "#9a7210"],
  link: ["#4f46e5", "#3730a3"],
};

const EMOJI: Record<RowKind, string> = {
  phone: "📞",
  mail: "✉️",
  fb: "👍",
  zalo: "💬",
  pin: "📍",
  clock: "🕘",
  lic: "🪪",
  link: "🔗",
};

const AVATAR_SVG = `<svg viewBox="0 0 100 100" role="img" aria-label="Real estate advisor avatar"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fd0f5"/><stop offset="1" stop-color="#fbe9bd"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag)"/><path d="M26 40c-6 20-4 40 6 52h36c10-12 12-32 6-52-4-14-14-20-24-20s-20 6-24 20z" fill="#2a1d18"/>
<path d="M12 100c2-22 16-31 38-31s36 9 38 31z" fill="#1f4fa3"/><path d="M40 70l10 14 10-14z" fill="#fff"/>
<rect x="44" y="58" width="12" height="14" rx="5" fill="#f0c4a0"/><circle cx="50" cy="46" r="21" fill="#f6cfae"/><path d="M29 45a21 21 0 0 1 42 0c-6-4-10-9-12-14-8 6-20 6-30 14z" fill="#2a1d18"/>
<circle cx="42" cy="51" r="2.5" fill="#2a1a12"/><circle cx="58" cy="51" r="2.5" fill="#2a1a12"/><path d="M43 59q7 6 14 0" fill="none" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="37" cy="57" r="3.2" fill="#ff9c8a" opacity=".65"/><circle cx="63" cy="57" r="3.2" fill="#ff9c8a" opacity=".65"/>
<circle cx="80" cy="82" r="13" fill="#fff"/><path d="M71 83l9-8 9 8v8H71z" fill="#e3b04b"/><rect x="77" y="84" width="6" height="7" fill="#1f4fa3"/></svg>`;

const STRINGS = {
  vi: {
    role: "Chuyên viên tư vấn",
    bio: "Đồng hành cùng bạn, từ lần đầu kết nối đến khi mọi việc hoàn tất.",
    labels: {
      phone: "Điện thoại",
      zalo: "Zalo",
      mail: "Email",
      fb: "Facebook",
      office: "Văn phòng",
      hours: "Giờ làm việc",
      lic: "Chứng chỉ",
    },
    hours: "Thứ 2 - Chủ nhật · 8:00 - 19:00",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Chạm vào ngôi nhà hoặc tấm biển nhé!",
    sale: "CẦN BÁN",
    sold: "ĐÃ BÁN",
    msgs: (n: string) => [
      `Xin chào! Mình là ${n}.`,
      "Bạn đang tìm hiểu dịch vụ gì? Nhắn mình nhé!",
      "Mình có thể sắp xếp thời gian phù hợp với bạn.",
      "Chạm vào các biểu tượng để liên hệ nhanh nhé!",
    ],
    tips: [
      "Hãy cho mình biết nhu cầu của bạn để được tư vấn phù hợp.",
      "Vị trí rất quan trọng: hãy xem giao thông và tiện ích xung quanh.",
      "Kiểm tra kỹ giấy tờ trước khi quyết định.",
      "Tham khảo các phương án tài chính phù hợp với bạn.",
    ],
    house: "Mọi kết nối tốt đẹp bắt đầu từ một cuộc trò chuyện nhỏ.",
    sign: "Mỗi tấm biển là một cột mốc mới.",
    tower: "Không gian hiện đại, kết nối thuận lợi.",
    key: "Khoảnh khắc trao chìa khóa luôn đáng nhớ.",
    pin: "Vị trí quyết định rất nhiều: hãy chọn nơi phù hợp.",
  },
  en: {
    role: "Advisor",
    bio: "Here to help you from the first hello to the final handshake.",
    labels: {
      phone: "Phone",
      zalo: "Zalo",
      mail: "Email",
      fb: "Facebook",
      office: "Office",
      hours: "Working hours",
      lic: "License",
    },
    hours: "Mon - Sun · 8:00 - 19:00",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Tap the house or the sign!",
    sale: "FOR SALE",
    sold: "SOLD",
    msgs: (n: string) => [
      `Hello! I'm ${n}.`,
      "What can I help you with? Message me!",
      "I can arrange a time that works for you.",
      "Tap the icons to get in touch quickly!",
    ],
    tips: [
      "Tell me what you need and I'll point you in the right direction.",
      "Location matters: look at traffic, schools and nearby amenities.",
      "Check documents carefully before you decide.",
      "Explore financing options that suit you.",
    ],
    house: "Every good connection starts with a small conversation.",
    sign: "Every sign is a new milestone.",
    tower: "Modern spaces, easy connections.",
    key: "Getting the keys is always a memorable moment.",
    pin: "Location says a lot: choose a place that fits your life.",
  },
};

const CSS = `
.re-template{--brand:#1f4fa3;--gold:#e3b04b;--bg:#08142b;--card:rgba(10,26,56,.8);--line:rgba(140,180,255,.26);--text:#eef4ff;--muted:#a2b6d8;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif}
.re-template *{box-sizing:border-box;margin:0}
.re-template .stage{position:fixed;inset:0;background:linear-gradient(180deg,#9fd0f5 0,#d9edff 55%,#fff1d6 100%)}
.re-template #gl{width:100%;height:100%;display:block;touch-action:none}
.re-template .top{position:absolute;z-index:4;left:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,50,30,.5)}
.re-template .top button{border:0;background:transparent;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#16345a}
.re-template .top button.on{background:var(--brand);color:#fff}
.re-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:250px;padding:9px 13px;border-radius:14px;background:#fff;color:#0c1f44;font-size:13.5px;font-weight:500;line-height:1.4;text-align:center;box-shadow:0 6px 18px -8px rgba(0,50,30,.55);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.re-template .bubble.on{opacity:1;transform:translateX(-50%)}
.re-template .card{position:fixed;z-index:5;left:0;right:0;bottom:0;max-height:58vh;max-height:58dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,60,30,.55);transition:max-height .35s ease}
.re-template .card.min{max-height:225px}
.re-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.re-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid var(--bg);background:#fff;box-shadow:0 8px 22px -8px rgba(0,0,0,.5);overflow:hidden}
.re-template .avatar svg,.re-template .avatar img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.re-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.re-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.re-template .card.min .fold svg{transform:rotate(180deg)}
.re-template .who{text-align:center}
.re-template .co{display:inline-block;padding:2px 12px;border-radius:999px;background:color-mix(in srgb,var(--brand) 22%,transparent);border:1px solid var(--line);font-size:12.5px;font-weight:700;letter-spacing:.2px}
.re-template h1{margin-top:6px;font-size:25px;font-weight:800;line-height:1.2}
.re-template .role{display:inline-block;margin-top:8px;padding:4px 14px;border-radius:12px;background:color-mix(in srgb,var(--gold) 15%,transparent);border:1px solid color-mix(in srgb,var(--gold) 42%,transparent);color:var(--gold);font-size:12px;font-weight:600;letter-spacing:.5px}
.re-template .bio{margin:7px auto 0;max-width:36ch;color:var(--muted);font-size:14px;line-height:1.5}
.re-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.re-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:12.5px;font-weight:600;background:color-mix(in srgb,var(--brand) 14%,transparent)}
.re-template .rows{display:grid;gap:10px;margin-top:16px}
.re-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.re-template a.row:hover,.re-template a.row:active{border-color:var(--gold);transform:translateY(-1px)}
.re-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px;overflow:hidden}
.re-template .ico img{width:24px;height:24px;object-fit:contain}
.re-template .row span{font-size:15px;font-weight:600;line-height:1.3;word-break:break-word}
.re-template .note{margin-top:10px;text-align:center;font-size:11.5px;line-height:1.5;color:var(--muted)}
@media (min-width:860px){
.re-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,60,30,.55)}
.re-template .card.min{max-height:none}
.re-template .avatar{position:relative;top:auto;left:auto;margin:30px 0 0 24px}
.re-template .scroll{padding:14px 24px 28px;flex:1}
.re-template .fold{display:none}
.re-template .bubble{left:calc((100% - var(--panel))/2)}
.re-template .who{text-align:left}.re-template .bio{margin-left:0}.re-template .chips{justify-content:flex-start}.re-template h1{font-size:31px}.re-template .note{text-align:left}
}
@media (prefers-reduced-motion:reduce){.re-template .card{transition:none}}
`;

function formatRole(name?: string): string {
  if (!name) return "Member";
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayUrl(url: string): string {
  return url.replace(/^tel:/i, "").replace(/^mailto:/i, "");
}

function kindOf(item: TemplateItem): RowKind {
  const name = item.itemName.toLowerCase();
  const url = item.url.toLowerCase();
  if (url.startsWith("tel:") || name.includes("phone") || name.includes("mobile")) return "phone";
  if (url.startsWith("mailto:") || name.includes("mail") || name.includes("email")) return "mail";
  if (name.includes("facebook") || url.includes("facebook.com")) return "fb";
  if (name.includes("zalo") || url.includes("zalo.me")) return "zalo";
  if (name.includes("office") || name.includes("address") || url.includes("maps")) return "pin";
  if (name.includes("hour")) return "clock";
  if (name.includes("license") || name.includes("licence")) return "lic";
  return "link";
}

function openHref(href?: string) {
  if (!href) return;
  if (/^https?:\/\//i.test(href)) {
    window.open(href, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = href;
  }
}

let threePromise: Promise<any> | null = null;
function loadThree(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.THREE) return Promise.resolve(w.THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).THREE);
    script.onerror = () => reject(new Error("Failed to load three.js"));
    document.head.appendChild(script);
  });
  return threePromise;
}

export default function RealEstateTemplate({ user, items }: Props) {
  const [lang, setLang] = useState<Lang>("en");
  const [folded, setFolded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<Lang>(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

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

  const info = useMemo(() => {
    const find = (k: RowKind) => rows.find((r) => r.kind === k);
    const phone = find("phone");
    const mail = find("mail");
    const fb = find("fb");
    return {
      brand: "#1f4fa3",
      company: roleLabel,
      name: user.fullname,
      phone: phone?.href ?? "",
      phoneLabel: phone?.text ?? "",
      email: mail?.text ?? user.email,
      facebook: fb?.href ?? "",
      photo: user.avatarUrl || "",
    };
  }, [rows, roleLabel, user.fullname, user.email, user.avatarUrl]);

  const infoRef = useRef(info);
  useEffect(() => {
    infoRef.current = info;
  }, [info]);

  const chips = useMemo(() => items.slice(0, 5).map((i) => i.itemName), [items]);

  const avatarSrc = useMemo(() => {
    if (user.avatarUrl) return user.avatarUrl;
    return `data:image/svg+xml;utf8,${encodeURIComponent(AVATAR_SVG)}`;
  }, [user.avatarUrl]);

  useEffect(() => {
    let disposed = false;
    let cleanupScene: (() => void) | undefined;

    loadThree()
      .then((THREE) => {
        if (disposed || !THREE || !canvasRef.current) return;
        cleanupScene = setupScene(
          THREE,
          canvasRef.current,
          cardRef.current,
          stageRef.current,
          langRef,
          infoRef,
        );
      })
      .catch(() => {
        // 3D is decorative; the card panel still works without it.
      });

    return () => {
      disposed = true;
      cleanupScene?.();
    };
  }, []);

  const s = STRINGS[lang];

  return (
    <div className="re-template">
      <style>{CSS}</style>

      <div className="stage" ref={stageRef}>
        <div className="top" role="tablist" aria-label="Language">
          <button
            type="button"
            role="tab"
            aria-selected={lang === "vi"}
            className={lang === "vi" ? "on" : ""}
            onClick={() => setLang("vi")}
          >
            VI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lang === "en"}
            className={lang === "en" ? "on" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
        <canvas ref={canvasRef} id="gl" aria-label="3D profile scene" />
      </div>

      <main className={`card${folded ? " min" : ""}`} ref={cardRef}>
        <div className="avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt={user.fullname} />
        </div>
        <button
          className="fold"
          type="button"
          aria-label="Collapse or expand"
          onClick={() => setFolded((v) => !v)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        <div className="scroll">
          <section className="who">
            <span className="co">NFC Tap</span>
            <h1>{user.fullname}</h1>
            <p className="role">{roleLabel}</p>
            <p className="bio">{s.bio}</p>
            {chips.length > 0 && (
              <div className="chips">
                {chips.map((c) => (
                  <span className="chip" key={c}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </section>

          <nav className="rows">
            {rows.map((row) => {
              const [c1, c2] = COL[row.kind];
              const inner = (
                <>
                  <div
                    className="ico"
                    style={{ background: `linear-gradient(135deg,${c1},${c2})` }}
                  >
                    {row.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.iconUrl} alt={row.label} />
                    ) : (
                      <span aria-hidden>{EMOJI[row.kind]}</span>
                    )}
                  </div>
                  <div>
                    <span>{row.label}</span>
                  </div>
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
                <div className="row" key={row.id}>
                  {inner}
                </div>
              );
            })}
          </nav>

          <p className="note">{s.note}</p>
        </div>
      </main>
    </div>
  );
}

/**
 * Builds the 3D scene from the original standalone template. Kept imperative
 * because three.js manages its own render loop and canvas.
 */
function setupScene(
  THREE: any,
  canvas: HTMLCanvasElement,
  cardEl: HTMLElement | null,
  stageEl: HTMLDivElement | null,
  langRef: React.MutableRefObject<Lang>,
  infoRef: React.MutableRefObject<{
    brand: string;
    company: string;
    name: string;
    phone: string;
    phoneLabel: string;
    email: string;
    facebook: string;
    photo: string;
  }>,
): () => void {
  const cv = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fd0a0, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.0);
  sun.position.set(4, 7, 5);
  scene.add(sun);

  const brand = new THREE.Color(infoRef.current.brand);
  const GOLD = 0xe3b04b;
  const G = -1.3;
  const BASE = 11.2;

  const M = (c: any, o: any = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.05 }, o));
  const mesh = (geo: any, mat: any, x?: number, y?: number, z?: number, parent?: any) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x || 0, y || 0, z || 0);
    (parent || scene).add(o);
    return o;
  };
  const box = (w: number, h: number, d: number, c: any, x: number, y: number, z: number, p?: any) =>
    mesh(new THREE.BoxGeometry(w, h, d), M(c, { roughness: 0.7, metalness: 0.05 }), x, y, z, p);
  function prism(w: number, h: number, d: number, c: any, x: number, y: number, z: number, p?: any) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, h);
    shape.lineTo(-w / 2, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return mesh(g, M(c, { roughness: 0.6 }), x, y, z, p);
  }

  mesh(new THREE.CylinderGeometry(3.0, 3.1, 0.18, 64), M(0xffffff, { roughness: 0.4 }), 0, G - 0.09, 0);
  mesh(new THREE.CircleGeometry(2.9, 56), M(0x9fd68a), 0, G + 0.002, 0).rotation.x = -Math.PI / 2;
  mesh(
    new THREE.TorusGeometry(3.02, 0.04, 8, 80),
    M(brand, { emissive: brand, emissiveIntensity: 0.5 }),
    0,
    G - 0.02,
    0,
  ).rotation.x = Math.PI / 2;

  const house = new THREE.Group();
  house.position.set(1.0, G, -0.9);
  house.rotation.y = -0.35;
  scene.add(house);
  const wins: any[] = [];
  box(1.9, 0.85, 1.3, 0xf3ead8, -0.2, 0.425, 0, house);
  box(1.2, 0.7, 1.1, 0xf8f2e4, -0.45, 1.2, 0, house);
  prism(1.5, 0.45, 1.3, 0x3b4a6b, -0.45, 1.55, 0, house);
  box(0.74, 0.06, 1.4, 0x3b4a6b, 0.45, 0.88, 0, house);
  box(0.7, 0.55, 1.0, 0xe9e2d0, 1.15, 0.275, 0, house);
  box(0.76, 0.06, 1.06, 0x3b4a6b, 1.15, 0.58, 0, house);
  box(0.5, 0.4, 0.03, 0xcfd6df, 1.15, 0.22, 0.52, house);
  box(0.16, 0.4, 0.16, 0x8a4b3a, -0.9, 1.75, -0.2, house);
  function win(x: number, y: number, z: number, w: number, h: number) {
    const o = mesh(
      new THREE.BoxGeometry(w, h, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x9fd0ff,
        emissive: 0xffd27a,
        emissiveIntensity: 0.1,
        roughness: 0.2,
      }),
      x,
      y,
      z,
      house,
    );
    wins.push(o);
  }
  win(-0.05, 0.5, 0.655, 0.34, 0.32);
  win(0.4, 0.5, 0.655, 0.34, 0.32);
  win(-0.75, 1.2, 0.555, 0.3, 0.3);
  win(-0.2, 1.2, 0.555, 0.3, 0.3);
  win(-0.45, 1.55, 0.66, 0.001, 0.001);
  const door = new THREE.Group();
  door.position.set(-0.8, 0, 0.66);
  house.add(door);
  box(0.28, 0.55, 0.03, 0x5a3a2a, 0.14, 0.275, 0, door);
  mesh(new THREE.SphereGeometry(0.025, 8, 8), M(GOLD, { metalness: 0.8 }), 0.24, 0.28, 0.03, door);
  const puffs = [0, 1, 2, 3].map((i) => {
    const s = mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 1 }),
      -0.9,
      1.95,
      -0.2,
      house,
    );
    s.userData.o = i / 4;
    return s;
  });
  function tree(x: number, z: number, s: number) {
    const g = new THREE.Group();
    g.position.set(x, G, z);
    g.scale.setScalar(s);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 7), M(0x8a5a3c), 0, 0.25, 0, g);
    mesh(new THREE.IcosahedronGeometry(0.4, 1), M(0x3fa35a, { flatShading: true }), 0, 0.75, 0, g);
    mesh(new THREE.IcosahedronGeometry(0.28, 1), M(0x59b96e, { flatShading: true }), 0.12, 1.1, 0, g);
  }
  tree(2.35, 0.3, 1.1);
  tree(-0.5, -2.0, 1.0);
  tree(2.2, -2.1, 0.9);
  tree(-1.1, -0.6, 0.8);
  let lit = 0;

  function towerTex() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return { c, t };
  }
  function paintTower(tx: any) {
    const x = tx.c.getContext("2d");
    x.fillStyle = "#c9d6e6";
    x.fillRect(0, 0, 64, 128);
    for (let r = 0; r < 10; r++) {
      for (let q = 0; q < 4; q++) {
        x.fillStyle = Math.random() < 0.4 ? "#ffd98a" : "#6f86a8";
        x.fillRect(6 + q * 14, 6 + r * 12, 9, 7);
      }
    }
    tx.t.needsUpdate = true;
  }
  const towers = new THREE.Group();
  towers.position.set(-2.0, G, -1.6);
  scene.add(towers);
  const ttex: any[] = [];
  [
    [-0.55, 1.9, 0.5],
    [0, 2.5, 0.5],
    [0.55, 1.6, 0.5],
    [1.05, 2.1, 0.46],
  ].forEach(([x, hh, w]) => {
    const tx = towerTex();
    paintTower(tx);
    ttex.push(tx);
    mesh(
      new THREE.BoxGeometry(w, hh, w),
      new THREE.MeshStandardMaterial({ map: tx.t, roughness: 0.7 }),
      x,
      hh / 2,
      0,
      towers,
    );
    box(w + 0.04, 0.05, w + 0.04, 0x5b6b82, x, hh + 0.02, 0, towers);
  });

  const sign = new THREE.Group();
  sign.position.set(1.2, G, 1.0);
  sign.rotation.y = -0.45;
  scene.add(sign);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), M(0x6a4a2a), 0, 0.45, 0, sign);
  const board = new THREE.Group();
  board.position.set(0, 0.88, 0);
  sign.add(board);
  box(0.66, 0.4, 0.04, 0xffffff, 0, 0, 0, board);
  const signC = [0, 1].map(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 150;
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return { c, t };
  });
  [0, 1].forEach((i) => {
    const p = mesh(
      new THREE.PlaneGeometry(0.6, 0.35),
      new THREE.MeshBasicMaterial({ map: signC[i].t }),
      0,
      0,
      i ? -0.024 : 0.024,
      board,
    );
    if (i) p.rotation.y = Math.PI;
  });
  let lastLang: string | null = null;
  function drawSign() {
    const S = STRINGS[langRef.current];
    const I = infoRef.current;
    [
      [S.sale, I.brand],
      [S.sold, "#c0392b"],
    ].forEach(([txt, col], i) => {
      const x = signC[i].c.getContext("2d");
      if (!x) return;
      x.fillStyle = "#fff";
      x.fillRect(0, 0, 256, 150);
      x.fillStyle = col as string;
      x.fillRect(0, 0, 256, 34);
      x.fillStyle = "#fff";
      x.font = "700 22px sans-serif";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(I.company || "NFC Tap", 128, 18);
      x.fillStyle = col as string;
      x.font = "800 46px sans-serif";
      x.fillText(txt as string, 128, 92);
      x.fillStyle = "#555";
      x.font = "600 20px sans-serif";
      x.fillText(I.phoneLabel || I.name, 128, 132);
      signC[i].t.needsUpdate = true;
    });
  }
  let signAng = 0;
  let signTarget = 0;

  const key = new THREE.Group();
  key.position.set(-1.5, 2.3, -0.3);
  scene.add(key);
  const goldM = M(GOLD, { metalness: 0.85, roughness: 0.28 });
  mesh(new THREE.TorusGeometry(0.16, 0.045, 10, 24), goldM, 0, 0.25, 0, key);
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 10), goldM, 0, -0.08, 0, key);
  box(0.14, 0.06, 0.04, GOLD, 0.08, -0.22, 0, key);
  box(0.1, 0.06, 0.04, GOLD, 0.07, -0.32, 0, key);
  key.children.slice(-2).forEach((o: any) => (o.material = goldM));
  let keyBoost = 0;

  const pin = new THREE.Group();
  pin.position.set(1.0, 2.25, -0.9);
  scene.add(pin);
  const pinM = M(0xe8453c, { roughness: 0.35, metalness: 0.2 });
  mesh(new THREE.SphereGeometry(0.2, 20, 20), pinM, 0, 0.22, 0, pin);
  mesh(new THREE.ConeGeometry(0.16, 0.4, 20), pinM, 0, -0.05, 0, pin).rotation.x = Math.PI;
  mesh(new THREE.SphereGeometry(0.075, 12, 12), M(0xffffff), 0, 0.24, 0.14, pin);

  const av = new THREE.Group();
  av.position.set(-0.7, 0, 0.55);
  scene.add(av);
  const skin = M(0xf0c8a4);
  const blazer = M(brand, { roughness: 0.55 });
  const white = M(0xffffff);
  const hairM = M(0x2a1d18, { roughness: 0.85 });
  const dark = M(0x16212b, { roughness: 0.3 });
  const gold = M(GOLD, { metalness: 0.5, roughness: 0.35 });
  [-1, 1].forEach((sd) => {
    mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.75, 16), M(0x232c3d), sd * 0.22, -0.88, 0, av);
    mesh(new THREE.SphereGeometry(0.2, 16, 12), dark, sd * 0.22, -1.27, 0.09, av).scale.set(1, 0.55, 1.4);
  });
  mesh(new THREE.CylinderGeometry(0.5, 0.58, 1.05, 32), blazer, 0, 0.1, 0, av);
  mesh(new THREE.BoxGeometry(0.2, 0.5, 0.015), white, 0, 0.25, 0.572, av);
  mesh(new THREE.SphereGeometry(0.035, 8, 8), gold, 0.22, 0.3, 0.58, av);
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 16), skin, 0, 0.72, 0, av);
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  av.add(head);
  mesh(new THREE.SphereGeometry(0.56, 40, 32), skin, 0, 0.48, 0, head).scale.y = 1.04;
  mesh(
    new THREE.SphereGeometry(0.595, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hairM,
    0,
    0.5,
    0,
    head,
  ).rotation.x = -0.4;
  mesh(new THREE.SphereGeometry(0.6, 24, 20), hairM, 0, 0.15, -0.2, head).scale.set(1, 1.25, 0.7);
  const eyes: any[] = [];
  [-1, 1].forEach((sd) => {
    const e = mesh(new THREE.SphereGeometry(0.06, 16, 16), dark, sd * 0.2, 0.48, 0.51, head);
    e.scale.z = 0.6;
    eyes.push(e);
    mesh(new THREE.SphereGeometry(0.02, 8, 8), white, 0.02, 0.025, 0.05, e);
    mesh(new THREE.SphereGeometry(0.09, 16, 12), M(0xf5a3a0, { roughness: 0.9 }), sd * 0.32, 0.36, 0.44, head).scale.set(1, 0.7, 0.4);
  });
  const sm = mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI), M(0xc0392b), 0, 0.34, 0.51, head);
  sm.rotation.z = Math.PI;
  function arm(sd: number) {
    const g = new THREE.Group();
    g.position.set(sd * 0.64, 0.55, 0);
    av.add(g);
    mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.72, 16), blazer, 0, -0.36, 0, g);
    mesh(new THREE.SphereGeometry(0.13, 16, 16), skin, 0, -0.76, 0, g);
    g.rotation.z = sd * 0.12;
    return g;
  }
  const armL = arm(-1);
  const armR = arm(1);
  const tab = new THREE.Group();
  tab.position.set(0, -0.92, 0.15);
  armL.add(tab);
  mesh(new THREE.BoxGeometry(0.32, 0.42, 0.03), dark, 0, -0.08, 0, tab);
  mesh(
    new THREE.PlaneGeometry(0.27, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x10203d, emissive: brand, emissiveIntensity: 0.55 }),
    0,
    -0.08,
    0.017,
    tab,
  );

  function sprite(draw: (ctx: CanvasRenderingContext2D) => void, size: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    if (x) draw(x);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
    sp.scale.set(size, size, 1);
    scene.add(sp);
    return sp;
  }
  const props = [
    ["🏡", -3.4, 1.4, -0.5],
    ["🏢", 3.4, 1.8, -0.9],
    ["📍", -3.4, -0.2, 1.2],
    ["📝", 3.3, -0.3, 1.3],
    ["💰", 3.2, 3.0, -1.0],
  ].map(([em, x, y, z], i) => {
    const sp = sprite((g) => {
      g.fillStyle = "rgba(255,255,255,.88)";
      g.beginPath();
      g.arc(64, 64, 58, 0, 7);
      g.fill();
      g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(em as string, 64, 70);
    }, 0.9);
    sp.userData = { x, y, z, ph: i * 1.7, pulse: 0, i };
    return sp;
  });

  const contactItems: any[] = [];
  const contactHrefs = [
    infoRef.current.phone || "",
    infoRef.current.email ? `mailto:${infoRef.current.email}` : "",
    infoRef.current.facebook || "",
  ];
  ["phone", "mail", "fb"].forEach((k, i) => {
    const href = contactHrefs[i];
    const [c1, c2] = COL[k as RowKind];
    const sp = sprite((x) => {
      const g = x.createLinearGradient(0, 0, 128, 128);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      x.fillStyle = g;
      x.beginPath();
      x.arc(64, 64, 56, 0, 7);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.85)";
      x.lineWidth = 4;
      x.stroke();
      x.fillStyle = "#fff";
      x.font = '64px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(EMOJI[k as RowKind], 64, 70);
    }, 0.85);
    sp.userData = { href, a: (i * Math.PI * 2) / 3 + 0.6 };
    contactItems.push(sp);
  });

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  (stageEl || cv.parentNode)?.appendChild(bubble);
  let hideT: ReturnType<typeof setTimeout> | undefined;
  let msgI = 0;
  let wave = 0;
  let camD = 11;
  let camAz = 0;
  let camTarget = 0;
  let down: { x: number; y: number } | null = null;
  let lookX = 0;
  let lookY = 0;
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
    return ray.intersectObjects(props)[0];
  };
  function near(obj: any, dy: number, e: PointerEvent, rad: number) {
    const r = cv.getBoundingClientRect();
    obj.getWorldPosition(tmp);
    tmp.y += dy;
    const p = tmp.project(cam);
    return (
      Math.hypot(
        e.clientX - (r.left + (p.x * 0.5 + 0.5) * r.width),
        e.clientY - (r.top + (-p.y * 0.5 + 0.5) * r.height),
      ) < rad
    );
  }
  const nearAgent = (e: PointerEvent) => near(av, 0.6, e, 62);
  const nearHouse = (e: PointerEvent) => near(house, 0.7, e, 82);
  const nearSign = (e: PointerEvent) => near(sign, 0.9, e, 50);
  const nearTower = (e: PointerEvent) => near(towers, 1.0, e, 72);
  const nearKey = (e: PointerEvent) => near(key, 0, e, 46);
  const nearPin = (e: PointerEvent) => near(pin, 0, e, 44);

  const onPointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const S = STRINGS[langRef.current];
    const hit = pickItem(e);
    const prop = !hit && pickProp(e);
    if (hit) {
      const u = hit.object.userData.href;
      if (u) openHref(u);
    } else if (prop) {
      prop.object.userData.pulse = 1;
      say(S.tips[prop.object.userData.i % S.tips.length]);
    } else if (nearKey(e)) {
      keyBoost = 1;
      say(S.key);
    } else if (nearPin(e)) {
      say(S.pin);
    } else if (nearSign(e)) {
      signTarget += Math.PI;
      say(S.sign);
    } else if (nearAgent(e)) {
      wave = 2.4;
      const G2 = S.msgs(infoRef.current.name);
      say(G2[msgI++ % G2.length]);
    } else if (nearHouse(e)) {
      lit = 1;
      say(S.house);
    } else if (nearTower(e)) {
      ttex.forEach(paintTower);
      say(S.tower);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor =
      pickItem(e) || pickProp(e) || nearKey(e) || nearPin(e) || nearSign(e) || nearAgent(e) || nearHouse(e) || nearTower(e)
        ? "pointer"
        : "default";
    const r = cv.getBoundingClientRect();
    lookX = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / r.width) * 2));
    lookY = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height * 0.35)) / r.height) * 2));
    if (down) camTarget = Math.max(-1.2, Math.min(1.2, (e.clientX - down.x) * 0.008));
  };
  const resetPointer = () => {
    down = null;
    camTarget = 0;
  };
  const onPointerLeave = () => {
    lookX = lookY = 0;
  };

  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("pointerup", onPointerUp);
  cv.addEventListener("pointermove", onPointerMove);
  cv.addEventListener("pointerup", resetPointer);
  cv.addEventListener("pointercancel", resetPointer);
  cv.addEventListener("pointerleave", resetPointer);
  cv.addEventListener("pointerleave", onPointerLeave);
  setTimeout(() => say(STRINGS[langRef.current].hint), 700);

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
    camD = Math.max(10, (BASE * h) / Math.min(effW, effH));
    cam.setViewOffset(w, h, wide ? cr.width * 0.25 : 0, wide ? 0 : (h - visH) * 0.25, w, h);
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  if (cardEl) ro.observe(cardEl);
  resize();

  const clock = new THREE.Clock();
  let blinkT = 2;
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (lastLang !== langRef.current) {
      drawSign();
      lastLang = langRef.current;
    }
    lit = Math.max(0, lit - dt * 0.16);
    keyBoost = Math.max(0, keyBoost - dt * 0.5);
    wins.forEach((w, i) => (w.material.emissiveIntensity = 0.1 + lit * (1.1 + Math.sin(t * 3 + i) * 0.15)));
    door.rotation.y = -Math.min(1, lit * 4) * 1.0;
    puffs.forEach((p) => {
      const u = (t * 0.25 + p.userData.o) % 1;
      p.position.set(-0.9 + u * 0.5, 1.95 + u * 1.0, -0.2);
      p.scale.setScalar(0.6 + u * 1.3);
      p.material.opacity = 0.5 * (1 - u);
    });
    signAng += (signTarget - signAng) * Math.min(1, dt * 6);
    board.rotation.y = signAng;
    sign.position.y = G;
    key.rotation.y = t * (1 + keyBoost * 9);
    key.position.y = 2.3 + Math.sin(t * 1.4) * 0.1;
    pin.rotation.y = t * 0.8;
    pin.position.y = 2.25 + Math.abs(Math.sin(t * 2)) * 0.18;
    av.position.y = Math.sin(t * 2) * 0.025;
    head.rotation.y += (lookX * 0.6 - head.rotation.y) * Math.min(1, dt * 6);
    head.rotation.x += (lookY * 0.3 - head.rotation.x) * Math.min(1, dt * 6);
    wave = Math.max(0, wave - dt);
    const tz = wave > 0 ? 2.7 + Math.sin(t * 12) * 0.3 : 0.12 + Math.sin(t * 1.6) * 0.03;
    armR.rotation.z += (tz - armR.rotation.z) * Math.min(1, dt * 10);
    armL.rotation.z = -0.12 + Math.sin(t * 1.6 + 1) * 0.03;
    blinkT -= dt;
    const bl = blinkT < 0.12 && blinkT > 0 ? 0.1 : 1;
    eyes.forEach((e) => (e.scale.y = bl));
    if (blinkT < 0) blinkT = 2 + Math.random() * 3;
    props.forEach((s) => {
      const u = s.userData;
      u.pulse = Math.max(0, u.pulse - dt * 1.5);
      s.position.set(u.x, u.y + Math.sin(t * 1.4 + u.ph) * 0.12, u.z);
      const k = 0.9 * (1 + Math.sin(u.pulse * Math.PI) * 0.45);
      s.scale.set(k, k, 1);
    });
    contactItems.forEach((s) => {
      const a = s.userData.a - t * 0.4;
      s.position.set(Math.cos(a) * 3.7, 0.9 + Math.sin(a * 1.3) * 0.5 + Math.sin(t * 1.3 + a) * 0.08, Math.sin(a) * 2.6 + 0.2);
    });
    camAz += (camTarget - camAz) * Math.min(1, dt * 5);
    const az = camAz + Math.sin(t * 0.25) * 0.06;
    cam.position.set(Math.sin(az) * camD, (3.4 * camD) / BASE, Math.cos(az) * camD);
    cam.lookAt(0, 0.4, 0);
    renderer.render(scene, cam);
  }
  loop();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    if (hideT) clearTimeout(hideT);
    cv.removeEventListener("pointerdown", onPointerDown);
    cv.removeEventListener("pointerup", onPointerUp);
    cv.removeEventListener("pointermove", onPointerMove);
    cv.removeEventListener("pointerup", resetPointer);
    cv.removeEventListener("pointercancel", resetPointer);
    cv.removeEventListener("pointerleave", resetPointer);
    cv.removeEventListener("pointerleave", onPointerLeave);
    bubble.remove();
    renderer.dispose();
  };
}
