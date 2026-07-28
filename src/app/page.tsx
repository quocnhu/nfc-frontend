"use client";

import { useEffect, useState, useRef } from "react";
import { Button, Typography, Space, Avatar, Tag, Card, Row, Col, Spin, Tooltip } from "antd";
import {
  LoginOutlined,
  CodeOutlined,
  CloudServerOutlined,
  ContainerOutlined,
  DeploymentUnitOutlined,
  ApiOutlined,
  DesktopOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  CustomerServiceOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  RightOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { homepageApi, type PublicHomepageData } from "@/lib/api";

const { Title, Paragraph, Text } = Typography;

const DEFAULT_SLIDESHOW = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
  "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80",
  "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&q=80",
];

const DEFAULT_TOUR_GUIDE_IMG = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";

const TOUR_GUIDE_DATA = [
  { icon: <CustomerServiceOutlined />, title: "Tour Guide", desc: "Leading guests through cultural landmarks, historical sites, and natural wonders with engaging storytelling." },
  { icon: <DesktopOutlined />, title: "Tour Operator", desc: "Planning itineraries, coordinating logistics, and ensuring seamless travel experiences for groups of all sizes." },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Slideshow({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  const items = photos.length > 0 ? photos : DEFAULT_SLIDESHOW;

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 20, overflow: "hidden", background: "#111" }}>
      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%" }}>
        {items.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i + 1}`}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? "scale(1)" : "scale(1.08)",
              transition: "opacity 1.2s ease, transform 4.5s ease",
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(transparent, rgba(10,10,30,0.85))",
          pointerEvents: "none",
        }}
      />
      {items.length > 1 && (
        <div style={{ position: "absolute", bottom: 24, left: 28, right: 28, color: "#fff", zIndex: 2 }}>
          <Space>
            {items.map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 28 : 10,
                  height: 10,
                  borderRadius: 5,
                  background: i === idx ? "#667eea" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  transition: "all 0.4s",
                }}
              />
            ))}
          </Space>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ icon, title, desc, color, isLast }: { icon: React.ReactNode; title: string; desc: string; color: string; isLast?: boolean }) {
  const { ref, visible } = useInView(0.2);
  return (
    <div ref={ref} style={{ display: "flex", gap: 20, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 0.6s ease" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `${color}18`,
            border: `2px solid ${color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: `linear-gradient(${color}44, transparent)`, marginTop: 8, minHeight: 40 }} />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 32 }}>
        <Text strong style={{ fontSize: 17, color: "#f0f0f0" }}>{title}</Text>
        <Paragraph style={{ color: "#999", margin: "4px 0 0", lineHeight: 1.6 }}>{desc}</Paragraph>
      </div>
    </div>
  );
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  const { ref, visible } = useInView(0.08);
  return (
    <section
      id={id}
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {children}
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [welcomePhase, setWelcomePhase] = useState(0);
  const [homepageData, setHomepageData] = useState<PublicHomepageData | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setWelcomePhase(1), 300);
    const t2 = setTimeout(() => setWelcomePhase(2), 1500);
    const t3 = setTimeout(() => setWelcomePhase(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    homepageApi.getPublic()
      .then((res) => {
        console.log('Homepage API Response:', res.data);
        if (res.data?.success && res.data.data) {
          setHomepageData(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Homepage API Error:', err);
      });
  }, []);

  const slideshowPhotos = homepageData?.slideshowpics?.map((img) => img.url) || [];
  const tourGuideImg = homepageData?.tourguidepic?.[0]?.url || DEFAULT_TOUR_GUIDE_IMG;
  const homepageAvatar = homepageData?.avatar || null;

  return (
    <div style={{ background: "#0a0a1e", minHeight: "100vh", color: "#fff", overflowX: "hidden", position: "relative" }}>
      {/* Welcome splash */}
      {welcomePhase < 3 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "#0a0a1e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: welcomePhase === 0 ? 0 : 1,
            transition: "opacity 0.6s ease",
          }}
        >
          {/* QN logo */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: welcomePhase >= 1 ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-20deg)",
              opacity: welcomePhase >= 1 ? 1 : 0,
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 0 40px #667eea55",
            }}
          >
            <Text strong style={{ color: "#fff", fontSize: 28, letterSpacing: 1 }}>QN</Text>
          </div>

          {/* Name + subtitle */}
          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              opacity: welcomePhase >= 2 ? 1 : 0,
              transform: welcomePhase >= 2 ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.5s ease",
            }}
          >
            <Title level={2} style={{ color: "#fff", margin: 0, fontSize: 28, fontWeight: 700 }}>
              Nguyen Quoc Nhu
            </Title>
            <Paragraph style={{ color: "#667eea", marginTop: 8, fontSize: 14, letterSpacing: 3, textTransform: "uppercase" }}>
              IT Professional &amp; Tour Guide
            </Paragraph>
          </div>

          {/* Welcome scrolling text */}
          <div
            style={{
              width: "100vw",
              maxWidth: 600,
              overflow: "hidden",
              marginTop: 40,
              borderTop: "1px solid rgba(102,126,234,0.3)",
              borderBottom: "1px solid rgba(102,126,234,0.3)",
              padding: "12px 0",
              opacity: welcomePhase >= 2 ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <div
              style={{
                whiteSpace: "nowrap",
                fontSize: 13,
                letterSpacing: 4,
                color: "#667eea",
                textTransform: "uppercase",
                fontWeight: 500,
                animation: welcomePhase >= 2 ? "marqueeScroll 4s linear infinite" : "none",
              }}
            >
              Welcome to Nguyen Quốc Nhu&apos;s website&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;Welcome to Nguyen Quốc Nhu&apos;s website&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;Welcome to Nguyen Quốc Nhu&apos;s website
            </div>
          </div>
        </div>
      )}

      {/* Animated background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 300 + i * 80,
              height: 300 + i * 80,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${["#667eea22", "#764ba222", "#00d4ff22", "#ff6b6b11", "#ffd93d11", "#6bcb7711"][i]}, transparent 70%)`,
              top: `${-10 + i * 15}%`,
              right: `${-5 + i * 10}%`,
              animation: `float ${8 + i * 2}s ease-in-out infinite alternate`,
              animationDelay: `${i * -1.5}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(-40px, 30px); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 20px #667eea44; } 50% { box-shadow: 0 0 40px #764ba266; } }
        @keyframes halo { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes ripple { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes welcomeLine { 0% { transform: translateX(-30%); } 50% { transform: translateX(30%); } 100% { transform: translateX(-30%); } }
        @keyframes marqueeScroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a1e; }
        ::-webkit-scrollbar-thumb { background: #667eea55; border-radius: 4px; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Water ripples */}
      {[
        { top: "15%", left: "8%", size: 180, color: "#667eea18", delay: "0s", dur: "6s" },
        { top: "70%", right: "5%", size: 220, color: "#00d4ff12", delay: "2s", dur: "8s" },
        { top: "45%", left: "85%", size: 140, color: "#764ba215", delay: "4s", dur: "7s" },
      ].map((r, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            top: r.top,
            left: r.left,
            right: r.right,
            width: r.size,
            height: r.size,
            borderRadius: "50%",
            border: `1.5px solid ${r.color}`,
            pointerEvents: "none",
            zIndex: 0,
            animation: `ripple ${r.dur} ease-out infinite`,
            animationDelay: r.delay,
          }}
        />
      ))}

      {/* ─── NAV ─── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "14px 16px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(10,10,30,0.75)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Space size={8}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              animation: "pulse 3s ease infinite",
            }}
          >
            <Text strong style={{ color: "#fff", fontSize: 14, letterSpacing: 1, lineHeight: 1 }}>QN</Text>
            <div
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                width: 18,
                height: 18,
                borderRadius: 6,
                background: "linear-gradient(135deg, #00d4ff, #00a0cc)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #0a0a1e",
              }}
            >
              <CodeOutlined style={{ color: "#fff", fontSize: 9 }} />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -5,
                right: -5,
                width: 18,
                height: 18,
                borderRadius: 6,
                background: "linear-gradient(135deg, #ffd93d, #e6b800)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #0a0a1e",
              }}
            >
              <EnvironmentOutlined style={{ color: "#fff", fontSize: 9 }} />
            </div>
          </div>
          <Text strong style={{ fontSize: 16, color: "#fff", letterSpacing: 0.5 }}>
            Quoc Nhu
          </Text>
        </Space>
        <Space size={12}>
          <Button
            type="text"
            style={{ color: "#ccc" }}
            onClick={() => document.getElementById("it-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            IT
          </Button>
          <Button
            type="text"
            style={{ color: "#ccc" }}
            onClick={() => document.getElementById("tour-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Tour Guide
          </Button>
          {status === "loading" ? (
            <Spin size="small" />
          ) : user ? (
            <Tooltip title="Go to Dashboard">
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={() => router.push("/profile")}
                style={{ borderRadius: 20, background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none" }}
              >
                Dashboard
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => router.push("/login")}
              style={{ borderRadius: 20, background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none" }}
            >
              Login
            </Button>
          )}
        </Space>
      </nav>

      {/* ─── HERO ─── */}
      <Section>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "120px 24px 60px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ marginBottom: 24, position: "relative", width: 120, height: 120 }}>
            {/* Halo rings */}
            <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "2px solid #667eea33", animation: "halo 3s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: -32, borderRadius: "50%", border: "1px solid #764ba222", animation: "halo 3s ease-in-out infinite 0.6s" }} />
            <div style={{ position: "absolute", inset: -48, borderRadius: "50%", border: "1px solid #00d4ff18", animation: "halo 3s ease-in-out infinite 1.2s" }} />
            <Avatar
              size={120}
              src={homepageAvatar || user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=QuocNhu&backgroundColor=667eea"}
              style={{
                border: "4px solid #667eea",
                boxShadow: "0 0 40px #667eea55, 0 0 80px #764ba233",
              }}
            />
          </div>
          <Title level={1} style={{ color: "#fff", margin: 0, fontSize: "clamp(28px, 8vw, 48px)", fontWeight: 800, letterSpacing: -1, textShadow: "0 2px 8px rgba(102,126,234,0.5), 0 4px 16px rgba(118,75,162,0.3)" }}>
            Quoc Nhu
          </Title>
          <Paragraph style={{ fontSize: "clamp(16px, 4vw, 20px)", color: "#aaa", marginTop: 8, marginBottom: 0 }}>
            IT Professional &amp; Tour Guide
          </Paragraph>
          <Paragraph style={{ color: "#777", fontSize: 14, maxWidth: 520, lineHeight: 1.8, marginTop: 16 }}>
            Bridging the digital world with real-world adventures.
            Building robust infrastructure by day, sharing cultures by journey.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<MailOutlined />}
            onClick={() => router.push(`/public/user?userId=${process.env.NEXT_PUBLIC_PROFILE_USER_ID || ""}`)}
            style={{
              marginTop: 28,
              borderRadius: 28,
              padding: "0 32px",
              height: 48,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Contact Me
          </Button>
        </div>
      </Section>

      {/* ─── SLIDESHOW ─── */}
      <Section id="slideshow">
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px", position: "relative", zIndex: 1 }}>
          <Title level={3} style={{ color: "#fff", textAlign: "center", marginBottom: 24 }}>
            <CameraOutlined style={{ marginRight: 10, color: "#667eea" }} />
            Journey Through My Lens
          </Title>
          <Slideshow photos={slideshowPhotos} />
        </div>
      </Section>

      {/* ═══════════ IT SECTION ═══════════ */}
      <Section id="it-section">
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Tag style={{ borderRadius: 20, padding: "4px 16px", marginBottom: 16, background: "#667eea18", color: "#667eea", border: "1px solid #667eea33", fontSize: 12 }}>
              INFORMATION TECHNOLOGY
            </Tag>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>
              <CodeOutlined style={{ marginRight: 12, color: "#667eea" }} />
              IT Infrastructure &amp; Cloud
            </Title>
            <Paragraph style={{ color: "#888", marginTop: 8, fontSize: 15 }}>
              Building reliable, scalable, and secure systems from network to cloud.
            </Paragraph>
          </div>

          <Row gutter={[40, 40]} style={{ alignItems: "stretch" }}>
            {/* Networking */}
            <Col xs={24} md={12} style={{ display: "flex" }}>
              <Card
                bordered={false}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #00d4ff33, #00d4ff11)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "#00d4ff",
                    }}
                  >
                    <CloudServerOutlined />
                  </div>
                  <Text strong style={{ color: "#f0f0f0", fontSize: 16 }}>Networking &amp; Cloud</Text>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {([
                    { label: "CCNA", color: "#00d4ff" },
                    { label: "MCSA", color: "#00a4ef" },
                    { label: "Linux", color: "#f5c842" },
                    { label: "VMware", color: "#69656a", children: [
                      { label: "VMware ESXi", color: "#69656a" },
                      { label: "Proxmox", color: "#e57000" },
                    ]},
                    { label: "Cloud AWS", color: "#ff9900" },
                    { label: "Cloud Google", color: "#34d399" },
                    { label: "Bash Scripting", color: "#4eaa25" },
                  ] as Array<{ label: string; color: string; children?: { label: string; color: string }[] }>).map((item) =>
                    item.children ? (
                      <div key={`g-${item.label}`} style={{ borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${item.color}22`, overflow: "hidden" }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", transition: "background 0.3s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}0a`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0, boxShadow: `0 0 8px ${item.color}66` }} />
                          <Text strong style={{ color: "#e0e0e0", fontSize: 14 }}>{item.label}</Text>
                        </div>
                        <div style={{ borderTop: `1px solid ${item.color}15` }}>
                          {item.children.map((child) => (
                            <div
                              key={child.label}
                              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px 10px 44px", transition: "background 0.3s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${child.color}0a`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: child.color, flexShrink: 0, boxShadow: `0 0 6px ${child.color}66` }} />
                              <Text style={{ color: "#c0c0c0", fontSize: 13 }}>{child.label}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.label}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", transition: "background 0.3s, border-color 0.3s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}0a`; e.currentTarget.style.borderColor = `${item.color}33`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0, boxShadow: `0 0 8px ${item.color}66` }} />
                        <Text strong style={{ color: "#e0e0e0", fontSize: 14 }}>{item.label}</Text>
                      </div>
                    )
                  )}
                </div>
              </Card>
            </Col>

            {/* DevOps */}
            <Col xs={24} md={12} style={{ display: "flex" }}>
              <Card
                bordered={false}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #6bcb7733, #6bcb7711)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "#6bcb77",
                    }}
                  >
                    <ContainerOutlined />
                  </div>
                  <Text strong style={{ color: "#f0f0f0", fontSize: 16 }}>DevOps &amp; Automation</Text>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Docker", color: "#2496ed" },
                    { label: "Kubernetes", color: "#818cf8" },
                    { label: "Prometheus", color: "#ef4444" },
                    { label: "Grafana", color: "#f97316" },
                    { label: "ArgoCD", color: "#a78bfa" },
                    { label: "CI/CD", color: "#22c55e" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.3s, border-color 0.3s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}0a`; e.currentTarget.style.borderColor = `${item.color}33`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: item.color,
                          flexShrink: 0,
                          boxShadow: `0 0 8px ${item.color}66`,
                        }}
                      />
                      <div>
                        <Text strong style={{ color: "#e0e0e0", fontSize: 14 }}>{item.label}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Architecture flow */}
          <div style={{ marginTop: 48 }}>
            <Card bordered={false} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
              <Row gutter={[24, 24]} align="middle" justify="center">
                {[
                  { icon: <DesktopOutlined />, label: "On-Premise", sub: "Linux / Cisco", color: "#fbbf24" },
                  { icon: <CloudServerOutlined />, label: "Cloud", sub: "AWS / GCP", color: "#22d3ee" },
                  { icon: <ContainerOutlined />, label: "Containers", sub: "Docker / K8s", color: "#38bdf8" },
                  { icon: <DeploymentUnitOutlined />, label: "CI/CD", sub: "ArgoCD", color: "#c084fc" },
                  { icon: <ApiOutlined />, label: "Monitoring", sub: "Prometheus", color: "#fb7185" },
                ].map((item, i, arr) => (
                  <Col key={item.label} xs={12} sm={8} md={4} style={{ position: "relative" }}>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: `${item.color}15`,
                          border: `1.5px solid ${item.color}44`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          color: item.color,
                          marginBottom: 10,
                          transition: "transform 0.3s, box-shadow 0.3s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = `0 0 24px ${item.color}44`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        {item.icon}
                      </div>
                      <Text strong style={{ color: "#e0e0e0", fontSize: 12, display: "block" }}>{item.label}</Text>
                      <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{item.sub}</div>
                      {i < arr.length - 1 && (
                        <RightOutlined style={{ position: "absolute", right: -18, top: 16, color: "#444", fontSize: 11 }} />
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </div>
        </div>
      </Section>

      {/* ═══════════ TOUR GUIDE SECTION ═══════════ */}
      <Section id="tour-section">
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Tag style={{ borderRadius: 20, padding: "4px 16px", marginBottom: 16, background: "#ffd93d18", color: "#ffd93d", border: "1px solid #ffd93d33", fontSize: 12 }}>
              TOUR GUIDE
            </Tag>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>
              <EnvironmentOutlined style={{ marginRight: 12, color: "#ffd93d" }} />
              Adventures &amp; Experiences
            </Title>
            <Paragraph style={{ color: "#888", marginTop: 8, fontSize: 15 }}>
              Turning destinations into unforgettable stories.
            </Paragraph>
          </div>

          <Row gutter={[48, 40]} align="top">
            <Col xs={24} md={14}>
              {TOUR_GUIDE_DATA.map((item, i) => (
                <TimelineItem
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  desc={item.desc}
                  color="#ffd93d"
                  isLast={i === TOUR_GUIDE_DATA.length - 1}
                />
              ))}
            </Col>
            <Col xs={24} md={10}>
              <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", height: "clamp(200px, 40vw, 360px)" }}>
                <img
                  src={tourGuideImg}
                  alt="Travel"
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,217,61,0.15), rgba(10,10,30,0.6))" }} />
                <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {[...Array(5)].map((_, i) => <StarFilled key={i} style={{ color: "#ffd93d" }} />)}
                  </div>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
                    "Every journey is a story waiting to be told."
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer id="footer" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <Space size={20} style={{ marginBottom: 16 }}>
          <Button type="text" shape="circle" icon={<GithubOutlined />} style={{ color: "#888", fontSize: 18 }} />
          <Button type="text" shape="circle" icon={<LinkedinOutlined />} style={{ color: "#888", fontSize: 18 }} />
          <Button type="text" shape="circle" icon={<MailOutlined />} style={{ color: "#888", fontSize: 18 }} />
        </Space>
        <Paragraph style={{ color: "#555", margin: 0, fontSize: 13 }}>
          &copy; 2026 Quoc Nhu &mdash; Built with passion for IT &amp; Travel
        </Paragraph>
      </footer>
    </div>
  );
}
