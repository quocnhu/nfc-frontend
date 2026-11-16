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

type Lang = "vi" | "en";

const STRINGS = {
  vi: {
    role: "Tài xế dịch vụ · Đưa đón & tour",
    bio: "Lái xe an toàn, đúng giờ, thân thiện. Đón sân bay, đi tỉnh, tour trong ngày.",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Chạm vào xe để bấm còi nhé!",
    msgs: (n: string) => [
      `Bíp bíp! Xin chào, mình là ${n} đây!`,
      "Cần xe đi sân bay? Nhắn mình nhé!",
      "Xe sạch, tài xế đúng giờ, giá rõ ràng!",
      "Chạm vào các biểu tượng để liên hệ nhé!",
    ],
    tips: [
      "Đón sân bay đúng giờ, theo dõi chuyến bay miễn phí.",
      "Giá trọn gói, báo trước, không phát sinh.",
      "Có ghế trẻ em và nước uống trên xe.",
      "Đặt trước 1 ngày để có xe đẹp giờ cao điểm.",
    ],
  },
  en: {
    role: "Driver Service · Pickup & Tours",
    bio: "Safe, punctual, friendly driving. Airport pickup, province trips, day tours.",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Tap the car to honk!",
    msgs: (n: string) => [
      `Beep beep! Hi, I'm ${n}!`,
      "Need an airport ride? Message me!",
      "Clean car, on-time driver, clear pricing!",
      "Tap the icons to get in touch!",
    ],
    tips: [
      "On-time airport pickup with free flight tracking.",
      "All-inclusive pricing, quoted upfront, no surprises.",
      "Child seats and water available in the car.",
      "Book a day ahead for the best car in peak hours.",
    ],
  },
};

const AVATAR_SVG = `<svg viewBox="0 0 100 100" role="img" aria-label="Driver avatar"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd24d"/><stop offset="1" stop-color="#ff8a4a"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag)"/><path d="M14 100c2-20 16-30 36-30s34 10 36 30z" fill="#2f6bff"/><path d="M42 72l8 10 8-10z" fill="#fff"/>
<rect x="44" y="60" width="12" height="14" rx="5" fill="#f0c4a0"/><circle cx="50" cy="46" r="21" fill="#f6cfae"/>
<path d="M28 42a22 19 0 0 1 44 0z" fill="#1d2a44"/><rect x="24" y="40" width="52" height="6" rx="3" fill="#16203a"/><rect x="40" y="31" width="20" height="7" rx="2" fill="#ffc83d"/>
<circle cx="42" cy="52" r="2.6" fill="#2a1a12"/><circle cx="58" cy="52" r="2.6" fill="#2a1a12"/><path d="M43 60q7 6 14 0" fill="none" stroke="#2a1a12" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="37" cy="58" r="3.4" fill="#ff9c8a" opacity=".7"/><circle cx="63" cy="58" r="3.4" fill="#ff9c8a" opacity=".7"/></svg>`;

const CSS = `
.dr-template{--brand:#ffb02e;--gold:#ffe14d;--bg:#062a33;--card:rgba(8,48,58,.78);--line:rgba(140,235,230,.26);--text:#effffd;--muted:#a3cfcc;--sun:#ffc83d;--lagoon:#2ee0c0;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif}
.dr-template *{box-sizing:border-box;margin:0}
@media (prefers-color-scheme:light){.dr-template{--bg:#eefbff;--card:rgba(255,255,255,.86);--line:rgba(10,120,130,.24);--text:#08303b;--muted:#4c7a84;--sun:#c47a00;--lagoon:#0a9c86}}
.dr-template .stage{position:fixed;inset:0;background:linear-gradient(180deg,#4fb6ff 0,#a9e0ff 55%,#ffeec2 100%)}
.dr-template #gl{width:100%;height:100%;display:block;touch-action:none}
.dr-template .top{position:absolute;z-index:4;left:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,60,80,.5)}
.dr-template .top button{border:0;background:transparent;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#16414d}
.dr-template .top button.on{background:linear-gradient(90deg,#ffb02e,#ffe14d);color:#2a1200}
.dr-template .top button:focus-visible{outline:2px solid #0a7f96;outline-offset:2px}
.dr-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:250px;padding:8px 13px;border-radius:14px;background:#fff;color:#08303b;font-size:14px;font-weight:600;line-height:1.35;text-align:center;box-shadow:0 6px 18px -8px rgba(0,60,80,.5);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.dr-template .bubble.on{opacity:1;transform:translateX(-50%)}
.dr-template .card{position:fixed;z-index:5;left:0;right:0;bottom:0;max-height:58vh;max-height:58dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,30,50,.5);transition:max-height .35s ease}
.dr-template .card.min{max-height:215px}
.dr-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.dr-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid var(--bg);background:#fff;box-shadow:0 8px 22px -8px rgba(0,0,0,.5)}
.dr-template .avatar svg,.dr-template .avatar img{position:relative;z-index:1;width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.dr-template .avatar::after{content:"";position:absolute;right:4px;bottom:6px;width:16px;height:16px;border-radius:50%;background:var(--lagoon);border:3px solid var(--bg);z-index:2}
.dr-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.dr-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.dr-template .card.min .fold svg{transform:rotate(180deg)}
.dr-template .fold:focus-visible,.dr-template a.row:focus-visible,.dr-template .top button:focus-visible{outline:2px solid var(--lagoon);outline-offset:3px}
.dr-template .who{text-align:center}
.dr-template .co{display:inline-block;padding:2px 12px;border-radius:999px;background:color-mix(in srgb,var(--sun) 18%,transparent);border:1px solid var(--line);font-size:12.5px;font-weight:700;letter-spacing:.2px}
.dr-template h1{margin-top:6px;font-size:27px;font-weight:800;line-height:1.15}
.dr-template .role{margin-top:2px;color:var(--sun);font-size:17px;font-weight:700}
.dr-template .bio{margin:6px auto 0;max-width:34ch;color:var(--muted);font-size:15px;line-height:1.4}
.dr-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.dr-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:600;background:color-mix(in srgb,var(--sun) 14%,transparent)}
.dr-template .rows{display:grid;gap:10px;margin-top:16px}
.dr-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.dr-template a.row:hover,.dr-template a.row:active{border-color:var(--sun);transform:translateY(-1px)}
.dr-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px;overflow:hidden}
.dr-template .ico img{width:24px;height:24px;object-fit:contain}
.dr-template .row span{font-size:16px;font-weight:600;line-height:1.25;word-break:break-word}
.dr-template .nfc{display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;color:var(--muted);margin-top:10px}
.dr-template .nfc i{flex:none;width:8px;height:8px;border-radius:50%;background:var(--sun);animation:dr-pulse 2s infinite}
@keyframes dr-pulse{0%{box-shadow:0 0 0 0 var(--sun)}70%,100%{box-shadow:0 0 0 10px transparent}}
@media (min-width:860px){
  .dr-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,30,50,.5)}
  .dr-template .card.min{max-height:none}
  .dr-template .avatar{position:relative;top:auto;left:auto;margin:30px 0 0 24px}
  .dr-template .scroll{padding:14px 24px 28px;flex:1}
  .dr-template .fold{display:none}
  .dr-template .bubble{left:calc((100% - var(--panel))/2)}
  .dr-template .nfc{justify-content:flex-start}
  .dr-template .who{text-align:left}
  .dr-template .bio{margin-left:0}
  .dr-template .chips{justify-content:flex-start}
  .dr-template h1{font-size:34px}
}
@media (prefers-reduced-motion:reduce){.dr-template .nfc i{animation:none}.dr-template .card{transition:none}}
`;

export default function DriverTemplate({ user, items }: TemplateProps) {
  const [lang, setLang] = useState<Lang>("vi");
  const [folded, setFolded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<Lang>(lang);

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
  const roleLabel = formatRole(user.role?.name);

  return (
    <div className="dr-template">
      <style>{CSS}</style>

      <div className="stage" ref={stageRef}>
        <div className="top" role="tablist" aria-label="Language">
          <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>VI</button>
          <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <canvas ref={canvasRef} id="gl" aria-label={lang === "vi" ? "Hòn đảo 3D: chiếc xe của tài xế chạy vòng quanh thành phố, chạm vào xe để bấm còi" : "3D island: the driver's car circles the city, tap the car to honk"} />
      </div>

      <main className={`card${folded ? " min" : ""}`} ref={cardRef}>
        <div className="avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarSrc} alt={user.fullname} />
        </div>
        <button className="fold" type="button" aria-label={lang === "vi" ? "Thu gọn hoặc mở rộng thông tin" : "Collapse or expand"} onClick={() => setFolded((v) => !v)}>
          <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
        </button>
        <div className="scroll">
          <section className="who">
            <span className="co">{roleLabel}</span>
            <h1>{user.fullname}</h1>
            <p className="role">{s.role}</p>
            <p className="bio">{s.bio}</p>
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

          <p className="nfc"><i /><span>{s.note}</span></p>
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
  infoRef: React.MutableRefObject<{ name: string; phone: string; email: string; facebook: string }>,
): () => void {
  const cv = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa8d8a0, 1.0));
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.0);
  sun.position.set(4, 7, 4);
  scene.add(sun);

  const M = (c: any, o: any = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0 }, o));
  const B = (c: any, o: any = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
  const mesh = (g: any, m: any, x?: number, y?: number, z?: number, p?: any) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x || 0, y || 0, z || 0);
    (p || scene).add(o);
    return o;
  };
  const flat = (c: any) => M(c, { flatShading: true });
  const flatRot = (o: any) => {
    o.rotation.x = -Math.PI / 2;
    return o;
  };

  mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.4, 56), M(0x6fcf6a), 0, -0.2, 0);
  mesh(new THREE.CylinderGeometry(3.5, 3.25, 0.4, 56), M(0x9a6a45), 0, -0.6, 0);
  mesh(new THREE.ConeGeometry(3.25, 2.4, 9, 1), flat(0x8a7a72), 0, -2.0, 0).rotation.x = Math.PI;
  const RP = 2.35;
  flatRot(mesh(new THREE.RingGeometry(1.95, 2.75, 72), M(0x3a3f4a, { side: THREE.DoubleSide }), 0, 0.01, 0));
  [1.98, 2.72].forEach((r) =>
    flatRot(mesh(new THREE.RingGeometry(r - 0.02, r + 0.02, 72), B(0xffffff, { side: THREE.DoubleSide }), 0, 0.016, 0)),
  );
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    mesh(new THREE.BoxGeometry(0.22, 0.004, 0.04), B(0xffd24d), Math.cos(a) * RP, 0.017, Math.sin(a) * RP).rotation.y =
      -(a + Math.PI / 2);
  }

  (
    [
      [0, 0, 0.7, 1.7, 0x7aa7d9],
      [-0.5, 0.3, 0.5, 1.2, 0xe6b86a],
      [0.5, -0.2, 0.55, 1.4, 0x9fb8c9],
      [0.05, -0.6, 0.45, 0.9, 0xd98a7a],
      [-0.4, -0.45, 0.4, 1.0, 0x8fc9a3],
      [0.45, 0.55, 0.42, 0.8, 0xc9a3d9],
    ] as [number, number, number, number, number][]
  ).forEach(([x, z, w, h, c]) => {
    mesh(new THREE.BoxGeometry(w, h, w), M(c, { roughness: 0.6 }), x, h / 2, z);
    mesh(new THREE.BoxGeometry(w * 1.04, 0.05, w * 1.04), M(0x39424e), x, h + 0.02, z);
    for (let k = 1; k < 4; k++)
      mesh(new THREE.BoxGeometry(w * 1.01, 0.05, w * 1.01), B(0xfff2b0, { transparent: true, opacity: 0.7 }), x, (h * k) / 4, z);
  });

  function palm(x: number, z: number, s: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    g.rotation.y = x * 3;
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.1, 7), M(0x8a5a3c), 0, 0.55, 0, g);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      const l = mesh(new THREE.SphereGeometry(0.34, 8, 6), flat(k % 2 ? 0x2fa24a : 0x3cb85a), Math.cos(a) * 0.3, 1.1, Math.sin(a) * 0.3, g);
      l.scale.set(1, 0.1, 0.3);
      l.rotation.set(0, -a, -0.35);
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    palm(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0.8);
  }
  (
    [
      [-1.3, 1.3],
      [1.3, 1.4],
      [-1.4, -1.2],
      [1.5, -1.2],
    ] as [number, number][]
  ).forEach(([x, z]) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.25, 6), M(0x7a5236), 0, 0.12, 0, g);
    mesh(new THREE.ConeGeometry(0.28, 0.6, 7), flat(0x2f8a4e), 0, 0.5, 0, g);
  });

  const clouds = (
    [
      [5.2, 2.4, 0, 0.18],
      [5.8, 3.4, 2.1, 0.12],
      [4.6, 1.5, 4, -0.15],
    ] as [number, number, number, number][]
  ).map(([r, y, a, sp]) => {
    const g = new THREE.Group();
    scene.add(g);
    (
      [
        [0, 0, 0, 0.55],
        [0.55, -0.1, 0.1, 0.42],
        [-0.55, -0.1, 0, 0.4],
        [0.15, 0.2, 0, 0.4],
      ] as [number, number, number, number][]
    ).forEach(([x, yy, z, s]) => mesh(new THREE.SphereGeometry(s, 12, 10), M(0xffffff, { roughness: 1 }), x, yy, z, g));
    (g as any).userData = { r, y, a, sp };
    return g;
  });
  mesh(new THREE.SphereGeometry(0.55, 24, 24), B(0xffe27a), 4.2, 4.4, -4);

  const car = new THREE.Group();
  car.scale.setScalar(1.45);
  scene.add(car);
  const body = M(0xffc83d, { roughness: 0.28, metalness: 0.55 });
  const glass = M(0x9fe8ff, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55 });
  mesh(new THREE.BoxGeometry(0.32, 0.1, 0.68), body, 0, 0.14, 0, car);
  mesh(new THREE.BoxGeometry(0.28, 0.1, 0.34), body, 0, 0.24, -0.03, car);
  mesh(new THREE.BoxGeometry(0.29, 0.065, 0.3), glass, 0, 0.245, -0.03, car);
  mesh(new THREE.SphereGeometry(0.042, 10, 8), M(0xf2c9a5), -0.07, 0.255, 0.02, car);
  mesh(new THREE.SphereGeometry(0.046, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1d2a44), -0.07, 0.262, 0.02, car);
  mesh(
    new THREE.BoxGeometry(0.12, 0.035, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffd24d, emissiveIntensity: 0.9 }),
    0,
    0.32,
    -0.03,
    car,
  );
  const wheels: any[] = [];
  const lamps: any[] = [];
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const w = new THREE.Group();
      w.position.set(sx * 0.17, 0.07, sz * 0.22);
      car.add(w);
      wheels.push(w);
      mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16), M(0x14171c, { roughness: 0.9 }), 0, 0, 0, w).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.055, 10), M(0xcfd6e6, { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, w).rotation.z =
        Math.PI / 2;
    }),
  );
  [-1, 1].forEach((s) => {
    lamps.push(
      mesh(
        new THREE.BoxGeometry(0.07, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3b0, emissiveIntensity: 0.8 }),
        s * 0.09,
        0.15,
        0.345,
        car,
      ),
    );
    mesh(
      new THREE.BoxGeometry(0.07, 0.04, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2a2a, emissiveIntensity: 0.9 }),
      s * 0.09,
      0.15,
      -0.345,
      car,
    );
  });
  flatRot(mesh(new THREE.CircleGeometry(0.3, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }), 0, 0.012, 0, car));

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

  const propEmojis = ["✈️", "🏨", "🏖️", "🧳"];
  const props = (
    [
      [-3.0, 2.9, -1.2],
      [3.0, 2.9, -1.0],
      [-3.3, 0.9, 1.8],
      [3.3, 0.9, 1.6],
    ] as [number, number, number][]
  ).map(([x, y, z], i) => {
    const s = sprite((g) => {
      g.fillStyle = "rgba(255,255,255,.85)";
      g.beginPath();
      g.arc(64, 64, 58, 0, 7);
      g.fill();
      g.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(propEmojis[i], 64, 70);
    }, 0.9);
    (s as any).userData = { x, y, z, ph: i * 1.7, pulse: 0 };
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
    (s as any).userData = { href: contactHrefs[k], a: (i * Math.PI * 2) / Math.max(contactKinds.length, 1) + 0.6 };
    contactItems.push(s);
  });

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  (stageEl || cv.parentNode)?.appendChild(bubble);
  let hideT: ReturnType<typeof setTimeout> | undefined;
  let honkI = 0;
  let tipI = 0;
  let honk = 0;
  let down: { x: number; y: number } | null = null;
  let ang = 0;
  let spin = 0;
  let camAz = 0;
  let camTarget = 0;
  let camD = 10.2;
  const say = (t: string) => {
    bubble.textContent = t;
    bubble.classList.add("on");
    if (hideT) clearTimeout(hideT);
    hideT = setTimeout(() => bubble.classList.remove("on"), 3400);
  };
  const ray = new THREE.Raycaster();
  const mv = new THREE.Vector2();
  const tmp = new THREE.Vector3();
  const setRay = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    mv.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mv, cam);
  };
  const pick = (e: PointerEvent, arr: any[]) => {
    setRay(e);
    return ray.intersectObjects(arr)[0];
  };
  const nearCar = (e: PointerEvent, rad: number) => {
    const r = cv.getBoundingClientRect();
    car.getWorldPosition(tmp);
    tmp.y += 0.3;
    const p = tmp.project(cam);
    return (
      Math.hypot(
        e.clientX - (r.left + (p.x * 0.5 + 0.5) * r.width),
        e.clientY - (r.top + (-p.y * 0.5 + 0.5) * r.height),
      ) < rad
    );
  };

  const onPointerDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const S = STRINGS[langRef.current];
    const hit = pick(e, contactItems);
    const prop = !hit && pick(e, props);
    if (hit) {
      const u = hit.object.userData.href;
      if (u) openHref(u);
    } else if (prop) {
      prop.object.userData.pulse = 1;
      say(S.tips[tipI++ % S.tips.length]);
    } else if (nearCar(e, 60)) {
      honk = 2.4;
      const msgs = S.msgs(infoRef.current.name);
      say(msgs[honkI++ % msgs.length]);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor = pick(e, contactItems) || pick(e, props) || nearCar(e, 60) ? "pointer" : "default";
    if (down) camTarget = Math.max(-1.4, Math.min(1.4, (e.clientX - down.x) * 0.01));
  };
  const resetPointer = () => {
    down = null;
    camTarget = 0;
  };

  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("pointerup", onPointerUp);
  cv.addEventListener("pointermove", onPointerMove);
  ["pointerup", "pointercancel", "pointerleave"].forEach((n) => cv.addEventListener(n, resetPointer as any));
  setTimeout(() => say(STRINGS[langRef.current].hint), 600);

  function resize() {
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const cr = cardEl ? cardEl.getBoundingClientRect() : { width: 0, top: h, height: 0 };
    const wide = window.innerWidth >= 860;
    const visH = wide ? h : Math.max(160, cr.top - 40);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    const effW = wide ? w - cr.width * 0.5 : w;
    const effH = wide ? h : visH + (h - visH) * 0.45;
    camD = Math.max(9.5, (10.2 * h) / Math.min(effW, effH));
    cam.setViewOffset(w, h, wide ? cr.width * 0.25 : 0, wide ? 0 : (h - visH) * 0.25, w, h);
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
    honk = Math.max(0, honk - dt);
    const moving = honk <= 0;
    if (moving) {
      ang += dt * 0.5;
      spin += dt * 9;
    }
    car.position.set(Math.cos(ang) * RP, moving ? 0 : Math.abs(Math.sin(t * 14)) * 0.012, Math.sin(ang) * RP);
    car.rotation.y = Math.atan2(-Math.sin(ang), Math.cos(ang));
    wheels.forEach((w) => (w.rotation.x = spin));
    lamps.forEach((l) => (l.material.emissiveIntensity = moving ? 0.8 : Math.sin(t * 18) > 0 ? 2.4 : 0.3));
    clouds.forEach((g) => {
      const u = (g as any).userData;
      u.a += dt * u.sp;
      g.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.6 + u.a) * 0.1, Math.sin(u.a) * u.r * 0.7 - 1);
    });
    props.forEach((s) => {
      const u = (s as any).userData;
      u.pulse = Math.max(0, u.pulse - dt * 1.5);
      s.position.set(u.x, u.y + Math.sin(t * 1.4 + u.ph) * 0.12, u.z);
      const k = 0.9 * (1 + Math.sin(u.pulse * Math.PI) * 0.45);
      s.scale.set(k, k, 1);
    });
    contactItems.forEach((s) => {
      const a = (s as any).userData.a - t * 0.4;
      s.position.set(
        Math.cos(a) * 3.9,
        1.9 + Math.sin(a * 1.3) * 0.4 + Math.sin(t * 1.3 + a) * 0.08,
        Math.sin(a) * 3.0,
      );
    });
    camAz += (camTarget - camAz) * Math.min(1, dt * 5);
    const az = camAz + Math.sin(t * 0.25) * 0.08;
    cam.position.set(Math.sin(az) * camD, (4.4 * camD) / 10.2, Math.cos(az) * camD);
    cam.lookAt(0, 0.2, 0);
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
    ["pointerup", "pointercancel", "pointerleave"].forEach((n) => cv.removeEventListener(n, resetPointer as any));
    bubble.remove();
    renderer.dispose();
  };
}
