"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- three.js is loaded from a CDN at runtime and exposes untyped globals. */

import { useCallback, useEffect, useRef, useState } from "react";
import { loadThree } from "@/components/templates/template-utils";

const MESSAGES = [
  {
    vi: "Xin chào mọi người! Chào mừng các bạn đến với website của Nguyễn Quốc Nhu.",
    en: "Hi! Everybody. Welcome to Nguyễn Quốc Nhu’s website.",
  },
  {
    vi: "Mình cho phép các bạn hack website của mình.",
    en: "I allow you to hack my website.",
  },
  {
    vi: "Sẽ tốt hơn nếu mỗi khi chỉ ra điểm yếu, bạn góp ý mang tính xây dựng cho mình nhé.",
    en: "It would be better if you gave me constructive feedback whenever you pointed out weaknesses on my website.",
  },
];

const COLORS = {
  skin: 0xfff1d6,
  body: 0xd9381e,
  gold: 0xffc21a,
  hat: 0x7fb069,
  ear: 0xff7a1a,
  eye: 0xff9d3a,
  strap: 0x8e3b9f,
  dark: 0x2a1410,
};

const TYPE_SPEED = 35;
const PAUSE_MS = 450;
const HOLD_MS = 2800;

export function WelcomeBot() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [vi, setVi] = useState("");
  const [en, setEn] = useState("");
  const [caret, setCaret] = useState<"vi" | "en" | null>(null);
  const idxRef = useRef(0);
  const talkingRef = useRef(false);
  const typerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef<() => void>(() => {});
  const reduceRef = useRef(false);

  const say = useCallback((i: number) => {
    const len = MESSAGES.length;
    const nextIdx = ((i % len) + len) % len;
    idxRef.current = nextIdx;
    const m = MESSAGES[nextIdx];

    if (typerRef.current) {
      clearInterval(typerRef.current);
      typerRef.current = null;
    }
    if (pauseRef.current) {
      clearTimeout(pauseRef.current);
      pauseRef.current = null;
    }

    const typeInto = (which: "vi" | "en", setter: (s: string) => void, text: string, done: () => void) => {
      setter("");
      if (reduceRef.current) {
        setter(text);
        setCaret(null);
        done();
        return;
      }
      setCaret(which);
      let n = 0;
      typerRef.current = setInterval(() => {
        n += 1;
        setter(text.slice(0, n));
        if (n >= text.length) {
          if (typerRef.current) {
            clearInterval(typerRef.current);
            typerRef.current = null;
          }
          setCaret(null);
          done();
        }
      }, TYPE_SPEED);
    };

    setCaret(null);
    talkingRef.current = true;
    typeInto("vi", setVi, m.vi, () => {
      pauseRef.current = setTimeout(() => {
        typeInto("en", setEn, m.en, () => {
          talkingRef.current = false;
          pauseRef.current = setTimeout(() => advanceRef.current(), HOLD_MS);
        });
      }, PAUSE_MS);
    });
  }, []);

  const next = useCallback(() => say(idxRef.current + 1), [say]);

  useEffect(() => {
    advanceRef.current = next;
  }, [next]);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial greeting must start after mount
    say(0);
    return () => {
      if (typerRef.current) clearInterval(typerRef.current);
      if (pauseRef.current) clearTimeout(pauseRef.current);
    };
  }, [say]);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | undefined;

    loadThree()
      .then((THREE: any) => {
        const stage = stageRef.current;
        if (disposed || !THREE || !stage) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        stage.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 1.2, 9);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xb08060, 0.9));
        const sun = new THREE.DirectionalLight(0xffffff, 0.9);
        sun.position.set(3, 6, 5);
        scene.add(sun);

        const mat = (c: number, o: any = {}) =>
          new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.05 }, o));
        const bot = new THREE.Group();
        scene.add(bot);

        const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat(COLORS.body));
        body.scale.set(1.05, 1.15, 0.9);
        body.position.y = -1.1;
        bot.add(body);

        const star = new THREE.Mesh(new THREE.CircleGeometry(0.34, 5), new THREE.MeshBasicMaterial({ color: COLORS.gold }));
        star.position.set(0, -1.0, 0.83);
        star.rotation.z = Math.PI / 2;
        bot.add(star);

        const head = new THREE.Group();
        head.position.y = 0.75;
        bot.add(head);

        const skull = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 32), mat(COLORS.skin));
        skull.scale.set(1.1, 1, 1);
        head.add(skull);

        const face = new THREE.Mesh(new THREE.SphereGeometry(0.88, 32, 24), mat(COLORS.dark, { roughness: 0.25 }));
        face.scale.set(1.12, 0.78, 0.5);
        face.position.set(0, 0.02, 0.78);
        head.add(face);

        const eyes: any[] = [];
        [-0.36, 0.36].forEach((x) => {
          const e = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), new THREE.MeshBasicMaterial({ color: COLORS.eye }));
          e.position.set(x, 0.12, 1.12);
          e.scale.z = 0.5;
          head.add(e);
          eyes.push(e);
        });

        const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12), new THREE.MeshBasicMaterial({ color: 0xff7a59 }));
        mouth.position.set(0, -0.27, 1.12);
        mouth.scale.set(1.3, 0.35, 0.4);
        head.add(mouth);

        [-0.62, 0.62].forEach((x) => {
          const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff8c7a }));
          c.position.set(x, -0.12, 1.05);
          c.scale.z = 0.4;
          head.add(c);
        });

        [-1.12, 1.12].forEach((x) => {
          const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 20), mat(COLORS.ear));
          ear.rotation.z = Math.PI / 2;
          ear.position.set(x, 0, 0);
          head.add(ear);
        });

        const hat = new THREE.Mesh(
          new THREE.ConeGeometry(1.75, 1.15, 48, 1, true),
          mat(COLORS.hat, { side: THREE.DoubleSide, roughness: 0.8 }),
        );
        hat.position.y = 1.2;
        head.add(hat);

        const hatTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat(COLORS.gold));
        hatTip.position.y = 1.8;
        head.add(hatTip);

        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.035, 8, 48, Math.PI), mat(COLORS.strap));
        strap.rotation.z = Math.PI;
        strap.position.set(0, 0.55, 0.1);
        strap.scale.set(1.1, 1, 1);
        head.add(strap);

        const makeArm = (side: number) => {
          const g = new THREE.Group();
          g.position.set(side * 1.05, -0.7, 0);
          const a = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 16), mat(COLORS.body));
          a.position.y = -0.5;
          g.add(a);
          const h = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), mat(COLORS.skin));
          h.position.y = -1.05;
          g.add(h);
          g.rotation.z = side * 0.35;
          bot.add(g);
          return g;
        };
        const armL = makeArm(-1);
        const armR = makeArm(1);

        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(1.3, 32),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -2.55;
        scene.add(shadow);

        const mouse = { x: 0, y: 0 };
        const onPointerMove = (e: PointerEvent) => {
          mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener("pointermove", onPointerMove);

        const raycaster = new THREE.Raycaster();
        const onCanvasClick = (e: MouseEvent) => {
          const r = renderer.domElement.getBoundingClientRect();
          raycaster.setFromCamera(
            { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 },
            camera,
          );
          if (raycaster.intersectObject(bot, true).length) next();
        };
        renderer.domElement.addEventListener("click", onCanvasClick);

        const resize = () => {
          const w = stage.clientWidth;
          const h = stage.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.position.z = w / h < 0.8 ? 13 : 9;
          camera.position.y = w / h < 0.8 ? 1.6 : 1.2;
          camera.lookAt(0, -0.6, 0);
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(stage);
        window.addEventListener("resize", resize);

        const clock = new THREE.Clock();
        let blinkAt = 2;
        const tick = () => {
          if (disposed) return;
          const t = clock.getElapsedTime();
          const k = reduceRef.current ? 0 : 1;
          bot.position.y = Math.sin(t * 2) * 0.1 * k - 0.5;
          shadow.scale.setScalar(1 - Math.sin(t * 2) * 0.05 * k);
          head.rotation.y += (mouse.x * 0.5 - head.rotation.y) * 0.08;
          head.rotation.x += (mouse.y * 0.25 - head.rotation.x) * 0.08;
          bot.rotation.y = Math.sin(t * 0.7) * 0.12 * k;
          armR.rotation.z = (2.4 + Math.sin(t * 7) * 0.35) * k + (reduceRef.current ? 0.35 : 0);
          armL.rotation.z = -0.35 - Math.sin(t * 2) * 0.05 * k;
          mouth.scale.y = talkingRef.current ? 0.35 + Math.abs(Math.sin(t * 14)) * 0.9 : 0.35;
          if (t > blinkAt) {
            eyes.forEach((e) => (e.scale.y = 0.1));
            if (t > blinkAt + 0.12) {
              eyes.forEach((e) => (e.scale.y = 1));
              blinkAt = t + 2 + Math.random() * 3;
            }
          }
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();

        cleanup = () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("resize", resize);
          renderer.domElement.removeEventListener("click", onCanvasClick);
          ro.disconnect();
          cancelAnimationFrame(raf);
          renderer.dispose?.();
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        };
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [next]);

  return (
    <div className="welcome-bot-widget">
      <div
        className="welcome-bot-bubble"
        role="button"
        tabIndex={0}
        aria-live="polite"
        aria-label="Next message"
        onClick={next}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            next();
          }
        }}
      >
        <p className={`welcome-bot-vi${caret === "vi" ? " caret" : ""}`}>{vi}</p>
        <p className={`welcome-bot-en${caret === "en" ? " caret" : ""}`}>{en}</p>
        <p className="welcome-bot-hint">Click the bot or this bubble for the next message.</p>
      </div>
      <div ref={stageRef} className="welcome-bot-stage" />
      <style>{`
        .welcome-bot-widget{position:fixed;right:16px;bottom:16px;z-index:150;display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-width:calc(100vw - 24px)}
        .welcome-bot-stage{width:200px;height:240px;flex:none;cursor:pointer}
        .welcome-bot-stage canvas{display:block;width:100%;height:100%}
        .welcome-bot-bubble{position:relative;width:min(340px,82vw);background:#fff8e6;color:#3a1410;border:3px solid #b3201f;border-radius:22px;padding:16px 20px 18px;box-shadow:6px 6px 0 #b3201f;cursor:pointer;font-family:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif}
        .welcome-bot-bubble::before{content:"";position:absolute;right:64px;bottom:-18px;border-left:14px solid transparent;border-right:14px solid transparent;border-top:18px solid #b3201f}
        .welcome-bot-bubble::after{content:"";position:absolute;right:68px;bottom:-13px;border-left:10px solid transparent;border-right:10px solid transparent;border-top:14px solid #fff8e6}
        .welcome-bot-vi{margin:0 0 6px;font-weight:800;font-size:clamp(19px,4.4vw,25px);line-height:1.25;color:#b3201f}
        .welcome-bot-en{margin:0;font-size:clamp(15px,3.4vw,18px);line-height:1.5;min-height:2.6em;max-width:46ch}
        .welcome-bot-hint{margin:10px 0 0;font-size:12px;line-height:1.4;opacity:.72}
        .welcome-bot-vi.caret::after,.welcome-bot-en.caret::after{content:"";display:inline-block;width:2px;height:1em;background:currentColor;margin-left:2px;vertical-align:-2px;animation:welcomeBotBlink 1s steps(2) infinite}
        @keyframes welcomeBotBlink{50%{opacity:0}}
        @media (max-width:640px){
          .welcome-bot-widget{right:10px;bottom:10px;gap:6px}
          .welcome-bot-stage{width:140px;height:170px}
          .welcome-bot-bubble{width:min(320px,86vw);padding:13px 16px 15px}
          .welcome-bot-bubble::before{right:52px}
          .welcome-bot-bubble::after{right:56px}
        }
        @media (prefers-reduced-motion:reduce){.welcome-bot-vi.caret::after,.welcome-bot-en.caret::after{animation:none}}
      `}</style>
    </div>
  );
}
