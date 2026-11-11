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
    role: "Chuyên viên tư vấn vận tải & logistics",
    bio: "Giải pháp vận chuyển, kho bãi và thông quan để hàng của bạn đến đúng nơi, đúng hẹn.",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Chạm vào xe tải nhé!",
    msgs: (n: string) => [
      `Xin chào! Mình là ${n}, tư vấn vận tải của bạn.`,
      "Bạn cần gửi hàng đường bộ, đường biển hay hàng không? Nhắn mình nhé!",
      "Gửi thông tin lô hàng, mình sẽ báo giá cho bạn.",
      "Chạm vào các biểu tượng để liên hệ nhanh nhé!",
    ],
    tips: [
      "Vận tải đường bộ: linh hoạt cho hàng nội địa, giao theo từng điểm.",
      "Vận tải đường biển: phù hợp cho lô hàng lớn đi quốc tế.",
      "Vận tải hàng không: lựa chọn cho hàng cần đến nhanh.",
      "Kho bãi: lưu trữ, đóng gói và phân phối hàng hóa.",
      "Thông quan: hỗ trợ chuẩn bị hồ sơ và thủ tục hải quan.",
    ],
    truck: "Bíp bíp! Xe đang trên đường giao hàng.",
    ship: "Tàu hàng đang chở những container đi xa.",
    plane: "Máy bay chở hàng đang bay qua!",
  },
  en: {
    role: "Transport & Logistics Advisor",
    bio: "Freight, warehousing and customs solutions to get your cargo to the right place, on time.",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Tap the truck!",
    msgs: (n: string) => [
      `Hello! I'm ${n}, your logistics advisor.`,
      "Need to ship by road, sea or air? Message me!",
      "Send me your shipment details and I'll prepare a quote.",
      "Tap the icons to get in touch quickly!",
    ],
    tips: [
      "Road freight: flexible for domestic cargo and multi-stop delivery.",
      "Sea freight: suited to large international shipments.",
      "Air freight: an option for cargo that must arrive fast.",
      "Warehousing: storage, packing and distribution.",
      "Customs: help preparing documents and clearance procedures.",
    ],
    truck: "Beep beep! The truck is out for delivery.",
    ship: "A cargo ship carrying containers far away.",
    plane: "A cargo plane is flying overhead!",
  },
};

const AVATAR_SVG = `<svg viewBox="0 0 100 100" role="img" aria-label="Logistics advisor avatar"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8ec9f5"/><stop offset="1" stop-color="#d9efff"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag)"/><path d="M12 100c2-22 16-31 38-31s36 9 38 31z" fill="#16365c"/><path d="M26 100c1-16 8-25 24-26 16 1 23 10 24 26z" fill="#ff7a1a"/><path d="M37 100V80M63 100V80" stroke="#e8eef5" stroke-width="3"/>
<rect x="44" y="58" width="12" height="14" rx="5" fill="#f0c4a0"/><circle cx="50" cy="46" r="21" fill="#f6cfae"/>
<path d="M28 44a22 21 0 0 1 44 0z" fill="#ffd23d"/><rect x="22" y="42" width="56" height="5" rx="2.5" fill="#f2b632"/><rect x="45" y="21" width="10" height="8" rx="3" fill="#f2b632"/>
<circle cx="42" cy="53" r="2.5" fill="#2a1a12"/><circle cx="58" cy="53" r="2.5" fill="#2a1a12"/><path d="M43 61q7 6 14 0" fill="none" stroke="#2a1a12" stroke-width="2.3" stroke-linecap="round"/>
<circle cx="37" cy="59" r="3.2" fill="#ff9c8a" opacity=".65"/><circle cx="63" cy="59" r="3.2" fill="#ff9c8a" opacity=".65"/></svg>`;

const CSS = `
.lg-template{--brand:#ff7a1a;--gold:#ffb938;--bg:#07162a;--card:rgba(10,32,58,.8);--line:rgba(130,190,255,.26);--text:#eef6ff;--muted:#9fb9d6;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif}
.lg-template *{box-sizing:border-box;margin:0}
.lg-template .stage{position:fixed;inset:0;background:linear-gradient(180deg,#8ec9f5 0,#cfeaff 55%,#fff0d2 100%)}
.lg-template #gl{width:100%;height:100%;display:block;touch-action:none}
.lg-template .top{position:absolute;z-index:4;left:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,50,30,.5)}
.lg-template .top button{border:0;background:transparent;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#16345a}
.lg-template .top button.on{background:var(--brand);color:#fff}
.lg-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:250px;padding:9px 13px;border-radius:14px;background:#fff;color:#0c2340;font-size:13.5px;font-weight:500;line-height:1.4;text-align:center;box-shadow:0 6px 18px -8px rgba(0,50,30,.55);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.lg-template .bubble.on{opacity:1;transform:translateX(-50%)}
.lg-template .card{position:fixed;z-index:5;left:0;right:0;bottom:0;max-height:58vh;max-height:58dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,60,30,.55);transition:max-height .35s ease}
.lg-template .card.min{max-height:225px}
.lg-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.lg-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid var(--bg);background:#fff;box-shadow:0 8px 22px -8px rgba(0,0,0,.5);overflow:hidden}
.lg-template .avatar svg,.lg-template .avatar img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.lg-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.lg-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.lg-template .card.min .fold svg{transform:rotate(180deg)}
.lg-template .who{text-align:center}
.lg-template .co{display:inline-block;padding:2px 12px;border-radius:999px;background:color-mix(in srgb,var(--brand) 22%,transparent);border:1px solid var(--line);font-size:12.5px;font-weight:700;letter-spacing:.2px}
.lg-template h1{margin-top:6px;font-size:25px;font-weight:800;line-height:1.2}
.lg-template .role{margin-top:2px;color:var(--gold);font-size:15.5px;font-weight:700}
.lg-template .bio{margin:7px auto 0;max-width:36ch;color:var(--muted);font-size:14px;line-height:1.5}
.lg-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.lg-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:12.5px;font-weight:600;background:color-mix(in srgb,var(--brand) 14%,transparent)}
.lg-template .rows{display:grid;gap:10px;margin-top:16px}
.lg-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.lg-template a.row:hover,.lg-template a.row:active{border-color:var(--gold);transform:translateY(-1px)}
.lg-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px;overflow:hidden}
.lg-template .ico img{width:24px;height:24px;object-fit:contain}
.lg-template .row span{font-size:15px;font-weight:600;line-height:1.3;word-break:break-word}
.lg-template .note{margin-top:10px;text-align:center;font-size:11.5px;line-height:1.5;color:var(--muted)}
@media (min-width:860px){
.lg-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,60,30,.55)}
.lg-template .card.min{max-height:none}
.lg-template .avatar{position:relative;top:auto;left:auto;margin:30px 0 0 24px}
.lg-template .scroll{padding:14px 24px 28px;flex:1}
.lg-template .fold{display:none}
.lg-template .bubble{left:calc((100% - var(--panel))/2)}
.lg-template .who{text-align:left}.lg-template .bio{margin-left:0}.lg-template .chips{justify-content:flex-start}.lg-template h1{font-size:31px}.lg-template .note{text-align:left}
}
@media (prefers-reduced-motion:reduce){.lg-template .card{transition:none}}
`;

export default function LogisticsTemplate({ user, items }: TemplateProps) {
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

  return (
    <div className="lg-template">
      <style>{CSS}</style>

      <div className="stage" ref={stageRef}>
        <div className="top" role="tablist" aria-label="Language">
          <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>VI</button>
          <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <canvas ref={canvasRef} id="gl" aria-label="3D port scene: a logistics advisor, a truck driving around the yard, a crane, a cargo ship and a plane" />
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
  infoRef: React.MutableRefObject<{ brand: string; name: string; phone: string; email: string; facebook: string }>,
): () => void {
  const cv = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8fb8e0, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.0);
  sun.position.set(4, 7, 5);
  scene.add(sun);
  const brand = new THREE.Color(infoRef.current.brand);
  const G = -1.3;
  const BASE = 11.6;
  const M = (c: any, o: any = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.05 }, o));
  const mesh = (geo: any, mat: any, x?: number, y?: number, z?: number, parent?: any) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x || 0, y || 0, z || 0);
    (parent || scene).add(o);
    return o;
  };
  const box = (w: number, h: number, d: number, c: any, x: number, y: number, z: number, p?: any) =>
    mesh(new THREE.BoxGeometry(w, h, d), M(c, { roughness: 0.55, metalness: 0.2 }), x, y, z, p);
  const PAL = [0xe8662a, 0x2f6fb5, 0xf2f2f2, 0xc0392b, 0x2e9e6a, 0xf2b632];

  mesh(new THREE.CircleGeometry(10, 64), M(0x2a8fd6, { roughness: 0.25, metalness: 0.2 }), 0, -1.68, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(4.2, 4.3, 0.5, 64), M(0xb9c2cc, { roughness: 0.8 }), 0, G - 0.25, 0);
  mesh(new THREE.RingGeometry(2.2, 3.2, 72), M(0x3a3f47, { side: THREE.DoubleSide }), 0, G + 0.004, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.RingGeometry(2.68, 2.72, 72), M(0xf2c14e, { side: THREE.DoubleSide }), 0, G + 0.008, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.CircleGeometry(2.15, 48), M(0xdfe5ec), 0, G + 0.003, 0).rotation.x = -Math.PI / 2;

  function stack(x: number, z: number, ry: number, seed: number) {
    const g = new THREE.Group();
    g.position.set(x, G, z);
    g.rotation.y = ry;
    scene.add(g);
    for (let k = 0; k < 2; k++)
      for (let c = 0; c < 2; c++) box(0.42, 0.4, 1.0, PAL[(c + k * 2 + seed) % 6], c * 0.46 - 0.23, 0.2 + k * 0.42, 0, g);
  }
  stack(3.25, -1.7, 0.5, 0);
  stack(3.7, 0.2, 1.6, 2);
  stack(-3.55, 0.9, -1.4, 4);

  const wh = new THREE.Group();
  wh.position.set(-2.9, G, -2.6);
  wh.rotation.y = Math.atan2(2.9, 2.6);
  scene.add(wh);
  box(1.7, 0.9, 1.1, 0xdfe6ee, 0, 0.45, 0, wh);
  box(1.8, 0.08, 1.2, brand, 0, 0.94, 0, wh);
  for (let i = -1; i <= 1; i++) box(0.38, 0.46, 0.03, 0x2a3340, i * 0.5, 0.25, 0.56, wh);
  [-0.45, 0.45].forEach((x) => box(0.3, 0.06, 0.5, 0x9fdcff, x, 0.99, 0, wh));

  const crane = new THREE.Group();
  crane.position.set(0, G, -3.75);
  scene.add(crane);
  [-0.95, 0.95].forEach((x) => box(0.12, 1.9, 0.12, 0x5b6b7d, x, 0.95, 0, crane));
  box(2.2, 0.14, 0.18, brand, 0, 1.9, 0, crane);
  const hang = new THREE.Group();
  hang.position.set(0, 1.8, 0);
  crane.add(hang);
  [-0.12, 0.12].forEach((x) => [-0.3, 0.3].forEach((z) => box(0.012, 0.5, 0.012, 0x333333, x, -0.25, z, hang)));
  box(0.3, 0.3, 0.7, 0x2f6fb5, 0, -0.65, 0, hang);

  const av = new THREE.Group();
  av.position.set(-0.3, 0, 0.45);
  scene.add(av);
  const skin = M(0xf0c8a4);
  const navy = M(0x16365c);
  const vest = M(brand, { roughness: 0.5 });
  const white = M(0xffffff);
  const hat = M(0xffd23d, { roughness: 0.4 });
  const dark = M(0x16212b, { roughness: 0.3 });
  const silver = M(0xe3e8ef, { metalness: 0.4 });
  [-1, 1].forEach((s) => {
    mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.75, 16), M(0x1d2b3d), s * 0.22, -0.88, 0, av);
    mesh(new THREE.SphereGeometry(0.2, 16, 12), dark, s * 0.22, -1.27, 0.09, av).scale.set(1, 0.55, 1.4);
  });
  mesh(new THREE.CylinderGeometry(0.5, 0.58, 1.05, 32), navy, 0, 0.1, 0, av);
  mesh(new THREE.CylinderGeometry(0.54, 0.61, 0.78, 32, 1, true), vest, 0, 0.14, 0, av);
  [0.28, -0.02].forEach((y) => (mesh(new THREE.TorusGeometry(0.575, 0.018, 8, 40), silver, 0, y, 0, av).rotation.x = Math.PI / 2));
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 16), skin, 0, 0.72, 0, av);
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  av.add(head);
  mesh(new THREE.SphereGeometry(0.56, 40, 32), skin, 0, 0.48, 0, head).scale.y = 1.04;
  const dome = mesh(new THREE.SphereGeometry(0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hat, 0, 0.56, 0, head);
  dome.scale.y = 0.95;
  mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.035, 32), hat, 0, 0.56, 0.05, head);
  mesh(new THREE.BoxGeometry(0.12, 0.08, 0.7), hat, 0, 0.97, 0, head);
  const eyes: any[] = [];
  [-1, 1].forEach((s) => {
    const e = mesh(new THREE.SphereGeometry(0.06, 16, 16), dark, s * 0.2, 0.4, 0.51, head);
    e.scale.z = 0.6;
    eyes.push(e);
    mesh(new THREE.SphereGeometry(0.02, 8, 8), white, 0.02, 0.025, 0.05, e);
    mesh(new THREE.SphereGeometry(0.09, 16, 12), M(0xf5a3a0, { roughness: 0.9 }), s * 0.32, 0.28, 0.44, head).scale.set(1, 0.7, 0.4);
  });
  const sm = mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI), dark, 0, 0.26, 0.51, head);
  sm.rotation.z = Math.PI;
  function arm(s: number) {
    const g = new THREE.Group();
    g.position.set(s * 0.64, 0.55, 0);
    av.add(g);
    mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.72, 16), navy, 0, -0.36, 0, g);
    mesh(new THREE.SphereGeometry(0.13, 16, 16), skin, 0, -0.76, 0, g);
    g.rotation.z = s * 0.12;
    return g;
  }
  const armL = arm(-1);
  const armR = arm(1);
  const tab = new THREE.Group();
  tab.position.set(0, -0.92, 0.15);
  armL.add(tab);
  mesh(new THREE.BoxGeometry(0.32, 0.42, 0.03), dark, 0, -0.08, 0, tab);
  mesh(new THREE.PlaneGeometry(0.27, 0.36), new THREE.MeshStandardMaterial({ color: 0x10243d, emissive: brand, emissiveIntensity: 0.55 }), 0, -0.08, 0.017, tab);
  box(0.34, 0.3, 0.34, 0xc9a46a, 0.95, G + 0.15, 0.4, scene);
  box(0.3, 0.24, 0.3, 0xd8b27a, 0.95, G + 0.42, 0.4, scene);
  box(0.345, 0.04, 0.345, 0xf2e3b3, 0.95, G + 0.17, 0.4, scene);

  const truck = new THREE.Group();
  truck.scale.setScalar(1.25);
  scene.add(truck);
  const truckWheels: any[] = [];
  const headlights: any[] = [];
  box(0.36, 0.32, 0.34, brand, 0, 0.3, 0.52, truck);
  box(0.37, 0.12, 0.2, 0x9fdcff, 0, 0.37, 0.64, truck);
  box(0.34, 0.08, 1.3, 0x2a2f38, 0, 0.14, 0, truck);
  box(0.44, 0.4, 0.9, 0xf4f6f9, 0, 0.4, -0.28, truck);
  box(0.445, 0.06, 0.9, brand, 0, 0.34, -0.28, truck);
  [-1, 1].forEach((s) => {
    headlights.push(
      mesh(new THREE.BoxGeometry(0.07, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }), s * 0.11, 0.22, 0.69, truck),
    );
    [0.55, -0.1, -0.45].forEach((z) => {
      const w = new THREE.Group();
      w.position.set(s * 0.21, 0.1, z);
      truck.add(w);
      truckWheels.push(w);
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 16), M(0x14171c), 0, 0, 0, w).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.075, 10), silver, 0, 0, 0, w).rotation.z = Math.PI / 2;
    });
  });

  const ship = new THREE.Group();
  ship.scale.setScalar(1.3);
  scene.add(ship);
  box(0.55, 0.3, 2.0, 0x223a5c, 0, 0.15, 0, ship);
  box(0.57, 0.08, 2.02, 0xb03a2e, 0, 0.04, 0, ship);
  box(0.5, 0.04, 1.96, 0x8a97a8, 0, 0.32, 0, ship);
  mesh(new THREE.ConeGeometry(0.3, 0.5, 4), M(0x223a5c), 0, 0.15, 1.22, ship).rotation.set(Math.PI / 2, 0, Math.PI / 4);
  box(0.5, 0.4, 0.3, 0xffffff, 0, 0.55, -0.8, ship);
  box(0.52, 0.08, 0.31, 0x2a3340, 0, 0.62, -0.8, ship);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), M(brand), 0, 0.82, -0.88, ship);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) box(0.2, 0.18, 0.24, PAL[(i + j * 2) % 6], j * 0.24 - 0.12, 0.43 + (i % 2) * 0.18, -0.3 + i * 0.3, ship);

  const plane = new THREE.Group();
  scene.add(plane);
  mesh(new THREE.CylinderGeometry(0.09, 0.07, 1.0, 12), M(0xffffff), 0, 0, 0, plane).rotation.x = Math.PI / 2;
  mesh(new THREE.ConeGeometry(0.09, 0.22, 12), M(0xffffff), 0, 0, 0.6, plane).rotation.x = Math.PI / 2;
  box(1.1, 0.025, 0.24, 0xe6ecf3, 0, 0, 0.05, plane);
  box(0.025, 0.22, 0.2, brand, 0, 0.12, -0.45, plane);
  box(0.4, 0.02, 0.12, 0xe6ecf3, 0, 0.02, -0.45, plane);
  [-0.28, 0.28].forEach((x) => (mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 10), M(0x5b6b7d), x, -0.05, 0.12, plane).rotation.x = Math.PI / 2));

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
  const props = [
    ["🚚", -3.3, 1.9, -0.5],
    ["🚢", 3.4, 1.6, -0.8],
    ["✈️", -3.4, 0.2, 1.2],
    ["📦", 3.3, -0.2, 1.1],
    ["🛃", -1.5, 3.0, -1.2],
  ].map(([em, x, y, z]: any, i: number) => {
    const s = sprite((g) => {
      g.fillStyle = "rgba(255,255,255,.88)";
      g.beginPath();
      g.arc(64, 64, 58, 0, 7);
      g.fill();
      g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(em as string, 64, 70);
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

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  (stageEl || cv.parentNode)?.appendChild(bubble);
  let hideT: ReturnType<typeof setTimeout> | undefined;
  let msgI = 0;
  let wave = 0;
  let horn = 0;
  let camD = 11;
  let camAz = 0;
  let camTarget = 0;
  let down: { x: number; y: number } | null = null;
  let lookX = 0;
  let lookY = 0;
  let ta = 0;
  let sa = 0;
  let pa = 0;
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
    return Math.hypot(e.clientX - (r.left + (p.x * 0.5 + 0.5) * r.width), e.clientY - (r.top + (-p.y * 0.5 + 0.5) * r.height)) < rad;
  }
  const nearAgent = (e: PointerEvent) => near(av, 0.6, e, 62);
  const nearTruck = (e: PointerEvent) => near(truck, 0.3, e, 58);
  const nearShip = (e: PointerEvent) => near(ship, 0.3, e, 70);
  const nearPlane = (e: PointerEvent) => near(plane, 0, e, 52);

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
    } else if (nearPlane(e)) {
      say(S.plane);
    } else if (nearShip(e)) {
      say(S.ship);
    } else if (nearTruck(e)) {
      horn = 1.8;
      say(S.truck);
    } else if (nearAgent(e)) {
      wave = 2.4;
      const G2 = S.msgs(infoRef.current.name);
      say(G2[msgI++ % G2.length]);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor =
      pickItem(e) || pickProp(e) || nearPlane(e) || nearShip(e) || nearTruck(e) || nearAgent(e) ? "pointer" : "default";
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
    camD = Math.max(10.5, (BASE * h) / Math.min(effW, effH));
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
    horn = Math.max(0, horn - dt);
    if (horn <= 0) {
      ta += dt * 0.32;
      truckWheels.forEach((w) => (w.rotation.x += dt * 7));
    }
    truck.position.set(Math.cos(ta) * 2.7, G, Math.sin(ta) * 2.7);
    truck.rotation.y = Math.atan2(-Math.sin(ta), Math.cos(ta));
    headlights.forEach((l) => (l.material.emissiveIntensity = horn > 0 ? (Math.sin(t * 18) > 0 ? 2.5 : 0.2) : 0.8));
    hang.position.x = Math.sin(t * 0.6) * 0.65;
    hang.position.y = 1.75 + Math.sin(t * 0.9) * 0.12;
    sa += dt * 0.09;
    ship.position.set(Math.cos(sa) * 5.1, -1.72 + Math.sin(t * 1.2) * 0.03, Math.sin(sa) * 5.1);
    ship.rotation.y = Math.atan2(-Math.sin(sa), Math.cos(sa));
    ship.rotation.z = Math.sin(t * 0.9) * 0.02;
    pa += dt * 0.45;
    plane.position.set(Math.cos(pa) * 4.2, 3.1 + Math.sin(t * 1.3) * 0.1, Math.sin(pa) * 4.2);
    plane.rotation.y = Math.atan2(-Math.sin(pa), Math.cos(pa));
    plane.rotation.z = 0.25;
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
    cam.position.set(Math.sin(az) * camD, (3.5 * camD) / BASE, Math.cos(az) * camD);
    cam.lookAt(0, 0.3, 0);
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
