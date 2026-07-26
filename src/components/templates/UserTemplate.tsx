"use client";

import React, { useEffect } from "react";
import { Avatar, Typography, Flex } from "antd";
import { motion } from "framer-motion";
import * as Icons from "@ant-design/icons";

const { Title, Text } = Typography;

const COLORS = {
  accent: "#4f46e5",
  accentRgb: "79, 70, 229",
  textPrimary: "#f0f0f8",
  textSecondary: "rgba(255,255,255,0.6)",
  textTertiary: "rgba(255,255,255,0.35)",
  surface: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  bg: "#1a1a2e",
};

function RippleRing({ delay, color }: { delay: number; color: string }) {
  return (
    <div
      className="ripple-ring"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        animation: `ripple 2s ease-out ${delay}s infinite`,
        willChange: "transform, opacity",
      }}
    />
  );
}

function getIcon(iconName: string): React.ReactNode {
  const map: Record<string, string> = {
    youtube: "YoutubeOutlined",
    tiktok: "TikTokOutlined",
    facebook: "FacebookOutlined",
    instagram: "InstagramOutlined",
    linkedin: "LinkedinOutlined",
    twitter: "TwitterOutlined",
    github: "GithubOutlined",
    globe: "GlobalOutlined",
    mail: "MailOutlined",
    phone: "PhoneOutlined",
    star: "StarOutlined",
    link: "LinkOutlined",
    world: "GlobalOutlined",
  };
  const name = map[iconName?.toLowerCase()] || "LinkOutlined";
  const Icon = (Icons as any)[name];
  return Icon ? <Icon /> : <Icons.LinkOutlined />;
}

const CARD_COLORS = [
  { bg: "rgba(79, 70, 229, 0.12)", border: "rgba(79, 70, 229, 0.35)", icon: "#818cf8" },
  { bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.35)", icon: "#f472b6" },
  { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.35)", icon: "#34d399" },
  { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.35)", icon: "#fbbf24" },
  { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.35)", icon: "#f87171" },
  { bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.35)", icon: "#a78bfa" },
  { bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.35)", icon: "#22d3ee" },
];

function WelcomeTicker({ text }: { text: string }) {
  return (
    <div style={{ position: "relative", height: 22, overflow: "hidden", marginBottom: 10 }}>
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
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, letterSpacing: 0.3, fontWeight: 400, whiteSpace: "nowrap" }}>
          {text}
        </Text>
      </div>
    </div>
  );
}

function openItem(url: string, itemName: string) {
  const lower = itemName.toLowerCase();
  if (lower.includes("email") || url.startsWith("mailto:")) {
    window.location.href = url.startsWith("mailto:") ? url : `mailto:${url}`;
  } else if (lower.includes("phone") || url.startsWith("tel:")) {
    window.location.href = url.startsWith("tel:") ? url : `tel:${url}`;
  } else {
    window.open(url, "_blank");
  }
}

interface Props {
  user: { fullname: string; avatarUrl?: string; email: string; role?: { id: string; name: string } };
  items: { id: string; url: string; itemName: string; icon: string; iconUrl?: string }[];
}

function formatRole(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UserTemplate({ user, items }: Props) {
  useEffect(() => {
    // Defer confetti loading for better initial performance
    const timer = setTimeout(() => {
      import("canvas-confetti").then((confetti) => {
        confetti.default({ particleCount: 60, spread: 70, origin: { y: 0.6 }, gravity: 1.2, scalar: 0.9 });
      }).catch(() => {}); // Silently fail if confetti can't load
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", justifyContent: "center", padding: "40px 16px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes ticker {
          0% { transform: translateX(-110%); opacity: 0; }
          25% { transform: translateX(0); opacity: 1; }
          75% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      <div className="profile-bg">
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }} 
        style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, marginTop: -35, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)", transform: "translateZ(0)" }}
      >
        <WelcomeTicker text={`Welcome to ${user.fullname}'s page`} />
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            style={{ 
              position: "relative", 
              display: "inline-block", 
              borderRadius: "50%", 
              boxShadow: `0 0 20px 5px rgba(${COLORS.accentRgb}, 0.25), 0 0 40px 10px rgba(${COLORS.accentRgb}, 0.1)`,
              animation: "pulse 3s ease-in-out infinite",
              willChange: "transform",
            }}
          >
            <RippleRing delay={0} color={`rgba(${COLORS.accentRgb}, 0.4)`} />
            <RippleRing delay={0.7} color={`rgba(${COLORS.accentRgb}, 0.3)`} />
            <RippleRing delay={1.4} color={`rgba(${COLORS.accentRgb}, 0.2)`} />
            <Avatar
              size={110}
              src={user.avatarUrl}
              style={{ border: `4px solid ${COLORS.accent}`, position: "relative", zIndex: 1, boxShadow: `0 4px 20px rgba(${COLORS.accentRgb}, 0.25)` }}
            />
          </motion.div>
          <Title level={3} style={{ marginTop: 20, marginBottom: 4, color: COLORS.textPrimary, textShadow: "0 2px 10px rgba(79, 70, 229, 0.4), 0 0 20px rgba(255, 255, 255, 0.2)" }}>{user.fullname}</Title>
          {user.role && (
            <div style={{ marginBottom: 8 }}>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                background: "rgba(79, 70, 229, 0.15)",
                border: "1px solid rgba(79, 70, 229, 0.3)",
                color: COLORS.accent,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}>
                {formatRole(user.role.name)}
              </span>
            </div>
          )}
        </div>

        <Flex vertical gap={10}>
          {items.map((item, i) => {
            const c = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.3, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ willChange: "transform, opacity" }}
              >
                <div
                  className="profile-item"
                  onClick={() => openItem(item.url, item.itemName)}
                  style={{
                    background: `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,0.03) 100%)`,
                    border: `1px solid ${c.border}`,
                    borderRadius: 14,
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: `0 4px 20px ${c.bg}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 32px ${c.border}, inset 0 1px 0 rgba(255,255,255,0.08)`;
                    e.currentTarget.style.borderColor = c.icon;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 4px 20px ${c.bg}, inset 0 1px 0 rgba(255,255,255,0.05)`;
                    e.currentTarget.style.borderColor = c.border;
                  }}
                >
                  <div 
                    style={{ 
                      fontSize: 20, 
                      color: c.icon, 
                      width: 36, 
                      height: 36, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      background: `radial-gradient(circle, ${c.bg} 0%, transparent 70%)`,
                      borderRadius: "50%",
                      border: `2px solid ${c.border}`,
                      boxShadow: `0 0 20px ${c.bg}`,
                    }}
                  >
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.itemName} style={{ width: 24, height: 24, objectFit: "contain" }} />
                    ) : (
                      getIcon(item.icon)
                    )}
                  </div>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>{item.itemName}</Text>
                </div>
              </motion.div>
            );
          })}
        </Flex>

        <div style={{ textAlign: "center", marginTop: "auto", paddingTop: 24 }}>
          <Text style={{ color: COLORS.textTertiary, fontSize: 12, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            Designed by <span style={{ color: COLORS.accent, fontWeight: 600 }}>Nguyen Quoc Nhu</span> - <span style={{ color: COLORS.textSecondary, fontWeight: 500 }}>NFC Tap</span>
          </Text>
        </div>
      </motion.div>
    </div>
  );
}
