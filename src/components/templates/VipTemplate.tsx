"use client";

import React, { useEffect } from "react";
import { Avatar, Typography, Flex } from "antd";
import { motion } from "framer-motion";
import * as Icons from "@ant-design/icons";

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
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `2px solid rgba(${COLORS.accent}, 0.6)`,
      }}
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
    />
  );
}

function SpotlightBeam({ color, originX, bottom, swing, duration, delay }: {
  color: string; originX: string; bottom?: boolean; swing: number; duration: number; delay: number;
}) {
  return (
    <motion.div
      style={{ position: "absolute", [bottom ? "bottom" : "top"]: -40, left: originX, width: 2, height: 0, transformOrigin: "top center", pointerEvents: "none" }}
      animate={{ rotate: [-swing, swing, -swing] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <motion.div
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: duration / 2, repeat: Infinity, ease: "easeInOut", delay }}
        style={{
          width: 0, height: 0,
          borderLeft: "90px solid transparent",
          borderRight: "90px solid transparent",
          [bottom ? "borderBottom" : "borderTop"]: "520px solid " + color,
          filter: "blur(18px)", opacity: 0.7, mixBlendMode: "screen",
        }}
      />
    </motion.div>
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
      <motion.div
        initial={{ x: "-120%", opacity: 0 }}
        animate={{ x: ["-110%", "0%", "0%", "120%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.25, 0.75, 1], repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        style={{ position: "absolute", left: 0, right: 0, textAlign: "center" }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, letterSpacing: 0.5, fontWeight: 400, whiteSpace: "nowrap" }}>
          {text}
        </Text>
      </motion.div>
    </div>
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
  user: { fullname: string; avatarUrl?: string; email: string };
  items: { id: string; url: string; itemName: string; icon: string; iconUrl?: string }[];
}

export default function VipTemplate({ user, items }: Props) {
  useEffect(() => {
    import("canvas-confetti").then((confetti) => {
      confetti.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <TheaterLights />

      {/* Top: Welcome */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 16, paddingBottom: 4 }}>
        <WelcomeTicker text={`Welcome to ${user.fullname}'s page`} />
      </div>

      {/* Center: Avatar + Items */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", position: "relative", zIndex: 1, padding: "0 20px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Avatar Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", paddingTop: 10, paddingBottom: 28 }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "relative", display: "inline-block", borderRadius: "50%",
                boxShadow: `0 0 25px 8px rgba(${COLORS.accent}, 0.35), 0 0 60px 15px rgba(${COLORS.accent}, 0.15)`,
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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <Title level={2} style={{ color: COLORS.textPrimary, marginTop: 22, marginBottom: 4, fontWeight: 700 }}>{user.fullname}</Title>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>{user.email}</Text>
            </motion.div>
          </motion.div>

          {/* Items */}
          <Flex vertical gap={10}>
            {items.map((item, i) => {
              const c = CARD_COLORS[i % CARD_COLORS.length];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div
                    onClick={() => openItem(item.url, item.itemName)}
                    style={{
                      padding: "14px 20px", borderRadius: 16, cursor: "pointer",
                      background: c.bg, border: `1px solid ${c.border}`,
                      backdropFilter: "blur(10px)",
                      transition: "box-shadow 0.25s, border-color 0.25s, background 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 6px 28px ${c.glow}`;
                      e.currentTarget.style.borderColor = c.icon;
                      e.currentTarget.style.background = c.glow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.background = c.bg;
                    }}
                  >
                    <Flex align="center" gap={15}>
                      <div style={{ fontSize: 24, color: c.icon, width: 32, height: 32, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.iconUrl ? (
                          <img src={item.iconUrl} alt={item.itemName} style={{ width: 28, height: 28, objectFit: "contain" }} />
                        ) : (
                          getIcon(item.icon)
                        )}
                      </div>
                      <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: 500 }}>{item.itemName}</Text>
                    </Flex>
                  </div>
                </motion.div>
              );
            })}
          </Flex>
        </div>
      </div>

      {/* Bottom: Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        style={{ textAlign: "center", padding: "20px 0 12px", position: "relative", zIndex: 1 }}
      >
        <Text style={{ color: COLORS.textTertiary, fontSize: 12, letterSpacing: 0.3 }}>
          Designed by <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}>Nguyen Quoc Nhu</span> - <span style={{ color: `rgb(${COLORS.accent})`, fontWeight: 500 }}>NFC Tap</span>
        </Text>
      </motion.div>
    </div>
  );
}
