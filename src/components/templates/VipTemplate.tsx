"use client";

import React, { useEffect } from "react";
import { Avatar, Typography, Flex } from "antd";
import {
  YoutubeOutlined,
  TikTokOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  GithubOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { safeUrl } from "@/lib/safe-url";

const { Title, Text } = Typography;

const COLORS = {
  accent: "255, 176, 32",
  textPrimary: "#F5F5F5",
  textSecondary: "rgba(255,255,255,0.55)",
  textTertiary: "rgba(255,255,255,0.32)",
  bg: "#0a0a0a",
};

function RippleRing({ delay }: { delay: number }) {
  return (
    <div
      className="ripple-ring"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `2px solid rgba(${COLORS.accent}, 0.6)`,
        animation: `ripple 2.4s ease-out ${delay}s infinite`,
        willChange: "transform, opacity",
      }}
    />
  );
}

function SpotlightBeam({ color, originX, bottom, duration, delay }: {
  color: string; originX: string; bottom?: boolean; swing: number; duration: number; delay: number;
}) {
  return (
    <div
      style={{ 
        position: "absolute", 
        [bottom ? "bottom" : "top"]: -40, 
        left: originX, 
        width: 2, 
        height: 0, 
        transformOrigin: "top center", 
        pointerEvents: "none",
        animation: `swing ${duration}s ease-in-out ${delay}s infinite`,
        willChange: "transform",
      }}
    >
      <div
        style={{
          width: 0, height: 0,
          borderLeft: "90px solid transparent",
          borderRight: "90px solid transparent",
          [bottom ? "borderBottom" : "borderTop"]: "520px solid " + color,
          filter: "blur(18px)", opacity: 0.7, mixBlendMode: "screen",
          animation: `pulse-opacity ${duration / 2}s ease-in-out ${delay}s infinite`,
        }}
      />
    </div>
  );
}

function TheaterLights() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <SpotlightBeam color="rgba(0, 122, 255, 0.4)" originX="0%" swing={45} duration={5} delay={0} />
      <SpotlightBeam color="rgba(0, 90, 200, 0.4)" originX="100%" swing={45} duration={5} delay={2.5} />
      <SpotlightBeam color="rgba(120, 80, 220, 0.35)" originX="0%" bottom swing={40} duration={6} delay={1} />
      <SpotlightBeam color="rgba(160, 60, 180, 0.35)" originX="100%" bottom swing={40} duration={6} delay={3.5} />
    </div>
  );
}

function WelcomeTicker({ text }: { text: string }) {
  return (
    <div style={{ position: "relative", height: 24, overflow: "hidden" }}>
      <div
        className="welcome-ticker"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          textAlign: "center",
          animation: "ticker 4s ease-in-out infinite",
          animationDelay: "3s",
          willChange: "transform, opacity",
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, letterSpacing: 0.5, fontWeight: 400, whiteSpace: "nowrap" }}>
          {text}
        </Text>
      </div>
    </div>
  );
}

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  youtube: YoutubeOutlined,
  tiktok: TikTokOutlined,
  facebook: FacebookOutlined,
  instagram: InstagramOutlined,
  linkedin: LinkedinOutlined,
  twitter: TwitterOutlined,
  github: GithubOutlined,
  globe: GlobalOutlined,
  mail: MailOutlined,
  phone: PhoneOutlined,
  star: StarOutlined,
  link: LinkOutlined,
  world: GlobalOutlined,
};

function getIcon(iconName: string): React.ReactNode {
  const Icon = ICON_MAP[iconName?.toLowerCase()];
  return Icon ? <Icon /> : <LinkOutlined />;
}

function openItem(url: string, itemName: string) {
  const safe = safeUrl(url);
  if (!safe) return;
  const lower = itemName.toLowerCase();
  if (lower.includes("email") || safe.startsWith("mailto:")) {
    window.location.href = safe.startsWith("mailto:") ? safe : `mailto:${safe}`;
  } else if (lower.includes("phone") || safe.startsWith("tel:")) {
    window.location.href = safe.startsWith("tel:") ? safe : `tel:${safe}`;
  } else {
    window.open(safe, "_blank", "noopener,noreferrer");
  }
}

const CARD_COLORS = [
  { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", icon: "#f87171", glow: "rgba(239, 68, 68, 0.3)" },
  { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", icon: "#fbbf24", glow: "rgba(245, 158, 11, 0.3)" },
  { bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)", icon: "#34d399", glow: "rgba(16, 185, 129, 0.3)" },
  { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", icon: "#60a5fa", glow: "rgba(59, 130, 246, 0.3)" },
  { bg: "rgba(168, 85, 247, 0.1)", border: "rgba(168, 85, 247, 0.3)", icon: "#c084fc", glow: "rgba(168, 85, 247, 0.3)" },
  { bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.3)", icon: "#f472b6", glow: "rgba(236, 72, 153, 0.3)" },
  { bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.3)", icon: "#22d3ee", glow: "rgba(6, 182, 212, 0.3)" },
];

interface Props {
  user: { fullname: string; avatarUrl?: string; email: string; role?: { id: string; name: string } };
  items: { id: string; url: string; itemName: string; icon: string; iconUrl?: string }[];
}

function formatRole(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function VipTemplate({ user, items }: Props) {
  useEffect(() => {
    // Defer confetti loading for better initial performance
    const timer = setTimeout(() => {
      import("canvas-confetti").then((confetti) => {
        confetti.default({ particleCount: 80, spread: 70, origin: { y: 0.6 }, gravity: 1.2, scalar: 0.9 });
      }).catch(() => {}); // Silently fail if confetti can't load
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ticker {
          0% { transform: translateX(-110%); opacity: 0; }
          25% { transform: translateX(0); opacity: 1; }
          75% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes swing {
          0%, 100% { transform: rotate(-45deg); }
          50% { transform: rotate(45deg); }
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .template-item {
          transition: transform 0.2s ease;
        }
        .template-item:hover {
          transform: scale(1.02);
        }
        .template-item:active {
          transform: scale(0.98);
        }
      `}</style>
      <TheaterLights />

      {/* Top: Welcome */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 16, paddingBottom: 4 }}>
        <WelcomeTicker text={`Welcome to ${user.fullname}'s page`} />
      </div>

      {/* Center: Avatar + Items */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", position: "relative", zIndex: 1, padding: "0 20px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Avatar Section */}
          <div
            style={{ textAlign: "center", paddingTop: 10, paddingBottom: 28, transform: "translateZ(0)", animation: "fadeIn 0.4s ease-out backwards" }}
          >
            <div
              style={{
                position: "relative", display: "inline-block", borderRadius: "50%",
                boxShadow: `0 0 25px 8px rgba(${COLORS.accent}, 0.35), 0 0 60px 15px rgba(${COLORS.accent}, 0.15)`,
                animation: "pulse 3s ease-in-out infinite",
                willChange: "transform",
              }}
            >
              <RippleRing delay={0} />
              <RippleRing delay={0.8} />
              <RippleRing delay={1.6} />
              <Avatar
                size={130}
                src={user.avatarUrl}
                style={{ border: `4px solid rgba(${COLORS.accent}, 0.9)`, position: "relative", zIndex: 1 }}
              />
            </div>

            <div style={{ animation: "fadeInUp 0.5s ease-out 0.3s backwards" }}>
              <Title level={2} style={{ color: COLORS.textPrimary, marginTop: 22, marginBottom: 4, fontWeight: 700, textShadow: "0 2px 15px rgba(255, 176, 32, 0.5), 0 0 25px rgba(255, 255, 255, 0.3)" }}>{user.fullname}</Title>
              {user.role && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 14px",
                    borderRadius: "12px",
                    background: `rgba(${COLORS.accent}, 0.15)`,
                    border: `1px solid rgba(${COLORS.accent}, 0.4)`,
                    color: `rgb(${COLORS.accent})`,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}>
                    {formatRole(user.role.name)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <Flex vertical gap={10}>
            {items.map((item, i) => {
              const c = CARD_COLORS[i % CARD_COLORS.length];
              return (
                <div
                  key={item.id}
                  className="template-item"
                  style={{ willChange: "transform, opacity", animation: `fadeInUp 0.3s ease-out ${(0.3 + i * 0.08).toFixed(2)}s backwards` }}
                >
                  <div
                    onClick={() => openItem(item.url, item.itemName)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 14,
                      cursor: "pointer",
                      background: `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,0.02) 100%)`,
                      border: `1px solid ${c.border}`,
                      backdropFilter: "blur(10px)",
                      boxShadow: `0 4px 24px ${c.bg}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 8px 36px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`;
                      e.currentTarget.style.borderColor = c.icon;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${c.glow} 0%, ${c.bg} 100%)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 4px 24px ${c.bg}, inset 0 1px 0 rgba(255,255,255,0.05)`;
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.background = `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,0.02) 100%)`;
                    }}
                  >
                    <Flex align="center" gap={12}>
                      <div 
                        style={{ 
                          fontSize: 22, 
                          color: c.icon, 
                          width: 38, 
                          height: 38, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          background: `radial-gradient(circle, ${c.bg} 0%, transparent 70%)`,
                          borderRadius: "50%",
                          border: `2px solid ${c.border}`,
                          boxShadow: `0 0 24px ${c.bg}`,
                        }}
                      >
                        {item.iconUrl ? (
                          <img src={item.iconUrl} alt={item.itemName} style={{ width: 26, height: 26, objectFit: "contain" }} />
                        ) : (
                          getIcon(item.icon)
                        )}
                      </div>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>{item.itemName}</Text>
                    </Flex>
                  </div>
                </div>
              );
            })}
          </Flex>
        </div>
      </div>

      {/* Bottom: Footer */}
      <div
        style={{ textAlign: "center", padding: "20px 0 12px", position: "relative", zIndex: 1, animation: "fadeIn 0.5s ease-out 0.6s backwards" }}
      >
        <Text style={{ color: COLORS.textTertiary, fontSize: 12, letterSpacing: 0.3, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
          Designed by <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}>Nguyen Quoc Nhu</span> - <span style={{ color: `rgb(${COLORS.accent})`, fontWeight: 500 }}>NFC Tap</span>
        </Text>
      </div>
    </div>
  );
}
