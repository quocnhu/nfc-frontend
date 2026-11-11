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
    role: "Kế toán & tư vấn thuế",
    bio: "Sổ sách gọn gàng, báo cáo rõ ràng, để bạn yên tâm tập trung phát triển công việc.",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Chạm vào đồng xu hoặc biểu đồ nhé!",
    msgs: (n: string) => [
      `Xin chào! Mình là ${n}, kế toán của bạn.`,
      "Cần hỗ trợ sổ sách, thuế hay tiền lương? Nhắn mình nhé!",
      "Gửi chứng từ cho mình, mình sẽ giúp bạn sắp xếp gọn gàng.",
      "Chạm vào các biểu tượng để liên hệ nhanh nhé!",
    ],
    tips: [
      "Ghi sổ và chứng từ: giúp mọi giao dịch được lưu trữ gọn gàng, dễ tra cứu.",
      "Thuế: hỗ trợ chuẩn bị hồ sơ và kê khai thuế.",
      "Báo cáo tài chính: nhìn rõ bức tranh thu chi của doanh nghiệp.",
      "Tiền lương: hỗ trợ tính lương và các khoản trích theo quy định.",
      "Rà soát và tư vấn: nhìn lại số liệu để đưa ra quyết định tốt hơn.",
    ],
    bars: "Biểu đồ minh họa: theo dõi doanh thu và chi phí theo thời gian.",
    coin: "Quản lý dòng tiền tốt giúp việc kinh doanh vận hành vững vàng.",
    calc: "Mọi con số đều được kiểm tra kỹ trước khi báo cáo.",
    pie: "Cơ cấu chi phí: biết tiền đi đâu để điều chỉnh đúng chỗ.",
  },
  en: {
    role: "Accounting & Tax Advisor",
    bio: "Tidy books and clear reports, so you can focus on growing your work.",
    note: "NFC Project, designed by Nguyễn Quốc Nhu",
    hint: "Tap the coin or the chart!",
    msgs: (n: string) => [
      `Hello! I'm ${n}, your accountant.`,
      "Need help with bookkeeping, tax or payroll? Message me!",
      "Send me your documents and I'll keep them neatly organised.",
      "Tap the icons to get in touch quickly!",
    ],
    tips: [
      "Bookkeeping: keeps every transaction recorded and easy to find.",
      "Tax: help preparing documents and tax filings.",
      "Financial reports: a clear picture of income and spending.",
      "Payroll: help calculating pay and statutory deductions.",
      "Review and advice: look back at the numbers to decide better.",
    ],
    bars: "Illustrative chart: track revenue and costs over time.",
    coin: "Good cash-flow management keeps a business running steadily.",
    calc: "Every figure is checked carefully before it is reported.",
    pie: "Cost breakdown: know where the money goes and adjust wisely.",
  },
};

const AVATAR_SVG = `<svg viewBox="0 0 100 100" role="img" aria-label="Accountant avatar"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe6dc"/><stop offset="1" stop-color="#f6e7b8"/></linearGradient></defs>
<rect width="100" height="100" fill="url(#ag)"/><path d="M12 100c2-22 16-31 38-31s36 9 38 31z" fill="#0e7c66"/><path d="M40 70l10 14 10-14z" fill="#fff"/><path d="M48 74h4l2 10-4 4-4-4z" fill="#e0b13c"/>
<rect x="44" y="58" width="12" height="14" rx="5" fill="#f0c4a0"/><circle cx="50" cy="45" r="21" fill="#f6cfae"/><path d="M29 44a21 20 0 0 1 42 0v-4c0-12-9-20-21-20s-21 8-21 20z" fill="#1c1512"/>
<circle cx="42" cy="50" r="6.2" fill="none" stroke="#2b2b3a" stroke-width="1.8"/><circle cx="58" cy="50" r="6.2" fill="none" stroke="#2b2b3a" stroke-width="1.8"/><path d="M48 50h4" stroke="#2b2b3a" stroke-width="1.8"/>
<circle cx="42" cy="50" r="2.2" fill="#2a1a12"/><circle cx="58" cy="50" r="2.2" fill="#2a1a12"/><path d="M43 59q7 6 14 0" fill="none" stroke="#2a1a12" stroke-width="2.3" stroke-linecap="round"/>
<rect x="68" y="76" width="22" height="18" rx="4" fill="#1b2b27"/><rect x="71" y="79" width="16" height="5" rx="1.5" fill="#9bf0c8"/><g fill="#e0b13c"><circle cx="73" cy="88" r="1.6"/><circle cx="79" cy="88" r="1.6"/><circle cx="85" cy="88" r="1.6"/></g></svg>`;

const CSS = `
.ac-template{--brand:#0e7c66;--gold:#e0b13c;--bg:#061a17;--card:rgba(8,36,31,.8);--line:rgba(130,235,205,.26);--text:#effcf8;--muted:#9fcabf;--panel:min(440px,42vw);box-sizing:border-box;position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif}
.ac-template *{box-sizing:border-box;margin:0}
.ac-template .stage{position:fixed;inset:0;background:linear-gradient(180deg,#bfe6dc 0,#eaf7f2 55%,#fff3d2 100%)}
.ac-template #gl{width:100%;height:100%;display:block;touch-action:none}
.ac-template .top{position:absolute;z-index:4;left:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);box-shadow:0 6px 18px -8px rgba(0,50,30,.5)}
.ac-template .top button{border:0;background:transparent;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer;color:#124a40}
.ac-template .top button.on{background:var(--brand);color:#fff}
.ac-template .bubble{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);max-width:250px;padding:9px 13px;border-radius:14px;background:#fff;color:#0a2a24;font-size:13.5px;font-weight:500;line-height:1.4;text-align:center;box-shadow:0 6px 18px -8px rgba(0,50,30,.55);pointer-events:none;opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .25s,transform .25s;z-index:3}
.ac-template .bubble.on{opacity:1;transform:translateX(-50%)}
.ac-template .card{position:fixed;z-index:5;left:0;right:0;bottom:0;max-height:58vh;max-height:58dvh;display:flex;flex-direction:column;border:1px solid var(--line);border-bottom:0;border-radius:28px 28px 0 0;background:var(--card);backdrop-filter:blur(16px);box-shadow:0 -20px 60px -24px rgba(0,60,30,.55);transition:max-height .35s ease}
.ac-template .card.min{max-height:225px}
.ac-template .scroll{overflow-y:auto;overscroll-behavior:contain;padding:56px 18px calc(18px + env(safe-area-inset-bottom,0px));scrollbar-width:thin}
.ac-template .avatar{position:absolute;z-index:2;top:-48px;left:50%;margin-left:-48px;width:96px;height:96px;border-radius:50%;border:4px solid var(--bg);background:#fff;box-shadow:0 8px 22px -8px rgba(0,0,0,.5);overflow:hidden}
.ac-template .avatar svg,.ac-template .avatar img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}
.ac-template .fold{position:absolute;z-index:3;top:12px;right:14px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);display:grid;place-items:center;cursor:pointer}
.ac-template .fold svg{width:22px;height:22px;fill:currentColor;transition:transform .3s}
.ac-template .card.min .fold svg{transform:rotate(180deg)}
.ac-template .who{text-align:center}
.ac-template .co{display:inline-block;padding:4px 14px;border-radius:12px;background:color-mix(in srgb,var(--brand) 18%,transparent);border:1px solid color-mix(in srgb,var(--brand) 45%,transparent);color:var(--brand);font-size:12px;font-weight:600;letter-spacing:.5px}
.ac-template h1{margin-top:6px;font-size:25px;font-weight:800;line-height:1.2}
.ac-template .role{margin-top:2px;color:var(--gold);font-size:15.5px;font-weight:700}
.ac-template .bio{margin:7px auto 0;max-width:36ch;color:var(--muted);font-size:14px;line-height:1.5}
.ac-template .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:10px}
.ac-template .chip{padding:2px 11px;border-radius:999px;border:1px solid var(--line);font-size:12.5px;font-weight:600;background:color-mix(in srgb,var(--brand) 14%,transparent)}
.ac-template .rows{display:grid;gap:10px;margin-top:16px}
.ac-template .row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:16px;text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--bg) 45%,transparent);transition:border-color .2s,transform .2s}
.ac-template a.row:hover,.ac-template a.row:active{border-color:var(--gold);transform:translateY(-1px)}
.ac-template .ico{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:19px;overflow:hidden}
.ac-template .ico img{width:24px;height:24px;object-fit:contain}
.ac-template .row span{font-size:15px;font-weight:600;line-height:1.3;word-break:break-word}
.ac-template .note{margin-top:10px;text-align:center;font-size:11.5px;line-height:1.5;color:var(--muted)}
@media (min-width:860px){
.ac-template .card{left:auto;top:0;width:var(--panel);max-height:none;border-radius:0;border:0;border-left:1px solid var(--line);box-shadow:-20px 0 60px -24px rgba(0,60,30,.55)}
.ac-template .card.min{max-height:none}
.ac-template .avatar{position:relative;top:auto;left:auto;margin:30px 0 0 24px}
.ac-template .scroll{padding:14px 24px 28px;flex:1}
.ac-template .fold{display:none}
.ac-template .bubble{left:calc((100% - var(--panel))/2)}
.ac-template .who{text-align:left}.ac-template .bio{margin-left:0}.ac-template .chips{justify-content:flex-start}.ac-template h1{font-size:31px}.ac-template .note{text-align:left}
}
@media (prefers-reduced-motion:reduce){.ac-template .card{transition:none}}
`;

export default function AccountingTemplate({ user, items }: TemplateProps) {
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
      brand: "#0e7c66",
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
    <div className="ac-template">
      <style>{CSS}</style>

      <div className="stage" ref={stageRef}>
        <div className="top" role="tablist" aria-label="Language">
          <button type="button" role="tab" aria-selected={lang === "vi"} className={lang === "vi" ? "on" : ""} onClick={() => setLang("vi")}>VI</button>
          <button type="button" role="tab" aria-selected={lang === "en"} className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <canvas ref={canvasRef} id="gl" aria-label="3D accounting scene" />
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
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fd6c6, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.0);
  sun.position.set(4, 7, 5);
  scene.add(sun);

  const brand = new THREE.Color(infoRef.current.brand);
  const GOLD = 0xe0b13c;
  const G = -1.3;
  const BASE = 11.2;
  const currency = "₫";

  const M = (c: any, o: any = {}) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.05 }, o));
  const mesh = (geo: any, mat: any, x?: number, y?: number, z?: number, parent?: any) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x || 0, y || 0, z || 0);
    (parent || scene).add(o);
    return o;
  };
  const box = (w: number, h: number, d: number, c: any, x: number, y: number, z: number, p?: any) =>
    mesh(new THREE.BoxGeometry(w, h, d), M(c, { roughness: 0.55, metalness: 0.15 }), x, y, z, p);

  mesh(new THREE.CylinderGeometry(3.0, 3.1, 0.18, 64), M(0xffffff, { roughness: 0.4 }), 0, G - 0.09, 0);
  mesh(new THREE.CircleGeometry(2.9, 56), M(0xe3f1ec), 0, G + 0.002, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.TorusGeometry(3.02, 0.04, 8, 80), M(brand, { emissive: brand, emissiveIntensity: 0.5 }), 0, G - 0.02, 0).rotation.x = Math.PI / 2;

  const calc = new THREE.Group();
  calc.position.set(-1.95, G, -1.2);
  calc.rotation.y = 0.4;
  scene.add(calc);
  box(0.85, 1.25, 0.14, 0x22302d, 0, 0.625, 0, calc);
  const dc = document.createElement("canvas");
  dc.width = 256;
  dc.height = 96;
  const dx = dc.getContext("2d");
  const dtex = new THREE.CanvasTexture(dc);
  dtex.encoding = THREE.sRGBEncoding;
  mesh(new THREE.PlaneGeometry(0.72, 0.27), new THREE.MeshBasicMaterial({ map: dtex }), 0, 1.0, 0.075, calc);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      box(0.15, 0.1, 0.05, c === 3 ? GOLD : 0xcfd8d4, -0.27 + c * 0.18, 0.68 - r * 0.17, 0.09, calc);
  let calcVal = 125000;
  let calcT = 0;
  function drawCalc() {
    if (!dx) return;
    dx.fillStyle = "#0f2b22";
    dx.fillRect(0, 0, 256, 96);
    dx.fillStyle = "#7dffb8";
    dx.font = "600 16px monospace";
    dx.textAlign = "left";
    dx.fillText("TOTAL", 10, 24);
    dx.font = "700 38px monospace";
    dx.textAlign = "right";
    dx.fillText(calcVal.toLocaleString("en-US"), 246, 72);
    dtex.needsUpdate = true;
  }
  drawCalc();

  const chart = new THREE.Group();
  chart.position.set(1.95, G, -0.45);
  chart.rotation.y = -0.5;
  scene.add(chart);
  box(1.6, 0.06, 0.8, 0xeef3f0, 0, 0.03, 0, chart);
  const bars = [0, 1, 2, 3, 4].map((i) => box(0.2, 1, 0.32, i % 2 ? GOLD : brand, -0.56 + i * 0.28, 0.5, 0, chart));
  box(1.6, 0.04, 0.04, brand, 0, 1.2, 0, chart).rotation.z = 0.3;
  mesh(new THREE.ConeGeometry(0.09, 0.24, 12), M(brand), 0.78, 1.46, 0, chart).rotation.z = -1.27;
  let barBoost = 0;

  function coinStack(x: number, z: number, n: number, s: number) {
    const g = new THREE.Group();
    g.position.set(x, G, z);
    scene.add(g);
    for (let i = 0; i < n; i++) {
      const c = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 28), M(GOLD, { metalness: 0.85, roughness: 0.28 }), Math.sin(i * s) * 0.012, 0.035 + i * 0.075, 0, g);
      c.rotation.y = i * s;
    }
  }
  coinStack(-2.05, 0.95, 6, 1.7);
  coinStack(-2.55, 0.45, 3, 2.3);
  coinStack(-1.6, 1.35, 2, 0.9);
  const books = new THREE.Group();
  books.position.set(2.0, G, 1.05);
  books.rotation.y = -0.35;
  scene.add(books);
  [
    [0.7, 0.14, 0.5, 0x1f4f8f, 0],
    [0.64, 0.13, 0.46, brand, 0.14],
    [0.6, 0.12, 0.44, 0x8a3b2f, 0.27],
  ].forEach(([w, h, d, c, y], i) => {
    box(w, h, d, c, 0, y + h / 2, 0, books).rotation.y = i * 0.12;
    box(w - 0.04, h - 0.04, d + 0.01, 0xf6f1e2, 0, y + h / 2, 0, books).rotation.y = i * 0.12;
  });

  function coinTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    if (!x) return new THREE.CanvasTexture(c);
    const g = x.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, "#ffe9a0");
    g.addColorStop(1, "#d9a62e");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    x.strokeStyle = "rgba(120,80,0,.6)";
    x.lineWidth = 6;
    x.beginPath();
    x.arc(64, 64, 52, 0, 7);
    x.stroke();
    x.fillStyle = "#7a5200";
    x.font = "bold 64px sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(currency, 64, 70);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const capM = new THREE.MeshStandardMaterial({ map: coinTex(), metalness: 0.6, roughness: 0.35 });
  const coin = new THREE.Group();
  coin.position.set(0.95, 2.5, -0.4);
  scene.add(coin);
  mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.09, 40), [M(GOLD, { metalness: 0.85, roughness: 0.28 }), capM, capM], 0, 0, 0, coin).rotation.x = Math.PI / 2;
  let coinAng = 0;
  let coinBoost = 0;

  const pie = new THREE.Group();
  pie.position.set(-1.95, 2.3, -0.7);
  pie.rotation.x = -0.6;
  scene.add(pie);
  const slices = [
    [0.55, brand],
    [0.3, GOLD],
    [0.15, 0x6aa6c9],
  ].map(([f, c]: any, i: number, arr: any[]) => {
    const start = arr.slice(0, i).reduce((s: number, a: any) => s + a[0], 0) * Math.PI * 2;
    const len = f * Math.PI * 2;
    const m = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 32, 1, false, start, len), M(c, { roughness: 0.4 }), 0, 0, 0, pie);
    m.userData.mid = start + len / 2;
    return m;
  });

  const LN = 60;
  const lp = new Float32Array(LN * 3);
  for (let i = 0; i < LN; i++) lp.set([(Math.random() - 0.5) * 7, -1.2 + Math.random() * 4.5, (Math.random() - 0.5) * 4], i * 3);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  scene.add(new THREE.Points(lg, new THREE.PointsMaterial({ color: GOLD, size: 0.1, transparent: true, opacity: 0.85 })));

  const av = new THREE.Group();
  av.position.set(-0.25, 0, 0.5);
  scene.add(av);
  const skin = M(0xf0c8a4);
  const vest = M(brand, { roughness: 0.5 });
  const white = M(0xffffff);
  const hairM = M(0x1c1512, { roughness: 0.85 });
  const dark = M(0x16212b, { roughness: 0.3 });
  const gold = M(GOLD, { metalness: 0.5, roughness: 0.35 });
  [-1, 1].forEach((s) => {
    mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.75, 16), M(0x26323c), s * 0.22, -0.88, 0, av);
    mesh(new THREE.SphereGeometry(0.2, 16, 12), dark, s * 0.22, -1.27, 0.09, av).scale.set(1, 0.55, 1.4);
  });
  mesh(new THREE.CylinderGeometry(0.5, 0.58, 1.05, 32), white, 0, 0.1, 0, av);
  mesh(new THREE.CylinderGeometry(0.53, 0.61, 0.9, 32, 1, true, 0.5, Math.PI * 2 - 1.0), vest, 0, 0.13, 0, av);
  mesh(new THREE.BoxGeometry(0.055, 0.34, 0.015), gold, 0, 0.2, 0.585, av);
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 16), skin, 0, 0.72, 0, av);
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  av.add(head);
  mesh(new THREE.SphereGeometry(0.56, 40, 32), skin, 0, 0.48, 0, head).scale.y = 1.04;
  mesh(new THREE.SphereGeometry(0.595, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.5, 0, head).rotation.x = -0.4;
  const eyes: any[] = [];
  [-1, 1].forEach((s) => {
    const e = mesh(new THREE.SphereGeometry(0.06, 16, 16), dark, s * 0.2, 0.48, 0.51, head);
    e.scale.z = 0.6;
    eyes.push(e);
    mesh(new THREE.SphereGeometry(0.02, 8, 8), white, 0.02, 0.025, 0.05, e);
    mesh(new THREE.TorusGeometry(0.1, 0.013, 8, 24), dark, s * 0.2, 0.48, 0.535, head);
    mesh(new THREE.SphereGeometry(0.09, 16, 12), M(0xf5a3a0, { roughness: 0.9 }), s * 0.32, 0.36, 0.44, head).scale.set(1, 0.7, 0.4);
  });
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), dark, 0, 0.5, 0.54, head).rotation.z = Math.PI / 2;
  const sm = mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 24, Math.PI), dark, 0, 0.34, 0.51, head);
  sm.rotation.z = Math.PI;
  function arm(s: number) {
    const g = new THREE.Group();
    g.position.set(s * 0.64, 0.55, 0);
    av.add(g);
    mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.72, 16), white, 0, -0.36, 0, g);
    mesh(new THREE.SphereGeometry(0.13, 16, 16), skin, 0, -0.76, 0, g);
    g.rotation.z = s * 0.12;
    return g;
  }
  const armL = arm(-1);
  const armR = arm(1);
  const ledger = new THREE.Group();
  ledger.position.set(0, -0.92, 0.15);
  armL.add(ledger);
  mesh(new THREE.BoxGeometry(0.34, 0.44, 0.07), M(0x1f4f8f), 0, -0.08, 0, ledger);
  mesh(new THREE.BoxGeometry(0.3, 0.4, 0.075), M(0xf6f1e2), 0.01, -0.08, 0, ledger);
  mesh(new THREE.BoxGeometry(0.05, 0.44, 0.075), gold, -0.16, -0.08, 0, ledger);

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
    ["🧾", -3.4, 1.4, -0.5],
    ["🏛️", 3.4, 1.8, -0.9],
    ["📊", -3.4, -0.2, 1.2],
    ["💼", 3.3, -0.3, 1.3],
    ["🔍", 3.2, 3.0, -1.0],
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
    return Math.hypot(e.clientX - (r.left + (p.x * 0.5 + 0.5) * r.width), e.clientY - (r.top + (-p.y * 0.5 + 0.5) * r.height)) < rad;
  }
  const nearAgent = (e: PointerEvent) => near(av, 0.6, e, 62);
  const nearCoin = (e: PointerEvent) => near(coin, 0, e, 52);
  const nearPie = (e: PointerEvent) => near(pie, 0, e, 52);
  const nearBars = (e: PointerEvent) => near(chart, 0.7, e, 72);
  const nearCalc = (e: PointerEvent) => near(calc, 0.6, e, 60);

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
    } else if (nearCoin(e)) {
      coinBoost = 1;
      say(S.coin);
    } else if (nearPie(e)) {
      say(S.pie);
    } else if (nearBars(e)) {
      barBoost = 1;
      say(S.bars);
    } else if (nearCalc(e)) {
      calcVal += 250000 + Math.floor(Math.random() * 500000);
      calcT = 0;
      say(S.calc);
    } else if (nearAgent(e)) {
      wave = 2.4;
      const G2 = S.msgs(infoRef.current.name);
      say(G2[msgI++ % G2.length]);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    cv.style.cursor =
      pickItem(e) || pickProp(e) || nearCoin(e) || nearPie(e) || nearBars(e) || nearCalc(e) || nearAgent(e) ? "pointer" : "default";
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
    barBoost = Math.max(0, barBoost - dt * 0.6);
    coinBoost = Math.max(0, coinBoost - dt * 0.5);
    bars.forEach((b, i) => {
      const hh = (0.35 + (Math.sin(t * 0.8 + i * 0.9) * 0.5 + 0.5) * 0.8) * (1 + barBoost * 0.35);
      b.scale.y = hh;
      b.position.y = 0.06 + hh / 2;
    });
    coinAng += dt * (1.4 + coinBoost * 10);
    coin.rotation.y = coinAng;
    coin.position.y = 2.5 + Math.sin(t * 1.3) * 0.1;
    pie.rotation.y = t * 0.3;
    const ex = Math.floor(t / 2) % 3;
    slices.forEach((s, i) => {
      const o = i === ex ? 0.14 : 0;
      const cur = s.userData.o || 0;
      const nv = cur + (o - cur) * Math.min(1, dt * 5);
      s.userData.o = nv;
      s.position.set(Math.sin(s.userData.mid) * nv, 0, Math.cos(s.userData.mid) * nv);
    });
    calcT -= dt;
    if (calcT <= 0) {
      calcT = 0.5;
      calcVal += 10000 + Math.floor(Math.random() * 90000);
      drawCalc();
    }
    const pa = lg.attributes.position;
    for (let i = 0; i < LN; i++) {
      let y = pa.getY(i) - dt * 0.35;
      if (y < -1.3) y = 3.4;
      pa.setY(i, y);
    }
    pa.needsUpdate = true;
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
