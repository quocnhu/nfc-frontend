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
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `2px solid ${color}`,
      }}
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay }}
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
      <motion.div
        initial={{ x: "-120%", opacity: 0 }}
        animate={{ x: ["-110%", "0%", "0%", "120%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.25, 0.75, 1], repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        style={{ position: "absolute", left: 0, right: 0, textAlign: "center" }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, letterSpacing: 0.3, fontWeight: 400, whiteSpace: "nowrap" }}>
          {text}
        </Text>
      </motion.div>
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
  user: { fullname: string; avatarUrl?: string; email: string };
  items: { id: string; url: string; itemName: string; icon: string; iconUrl?: string }[];
}

export default function UserTemplate({ user, items }: Props) {
  useEffect(() => {
    import("canvas-confetti").then((confetti) => {
      confetti.default({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", justifyContent: "center", padding: "40px 16px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      <div className="profile-bg">
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
        <div className="profile-ripple" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, marginTop: -35, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)" }}>
        <WelcomeTicker text={`Welcome to ${user.fullname}'s page`} />
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "relative", display: "inline-block", borderRadius: "50%", boxShadow: `0 0 20px 5px rgba(${COLORS.accentRgb}, 0.25), 0 0 40px 10px rgba(${COLORS.accentRgb}, 0.1)` }}
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
          <Title level={3} style={{ marginTop: 20, marginBottom: 4, color: COLORS.textPrimary }}>{user.fullname}</Title>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>{user.email}</Text>
        </div>

        <Flex vertical gap={12}>
          {items.map((item, i) => {
            const c = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <div
                  className="profile-item"
                  onClick={() => openItem(item.url, item.itemName)}
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ fontSize: 22, color: c.icon, width: 32, height: 32, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.itemName} style={{ width: 26, height: 26, objectFit: "contain" }} />
                    ) : (
                      getIcon(item.icon)
                    )}
                  </div>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: 500 }}>{item.itemName}</Text>
                </div>
              </motion.div>
            );
          })}
        </Flex>

        <div style={{ textAlign: "center", marginTop: "auto", paddingTop: 24 }}>
          <Text style={{ color: COLORS.textTertiary, fontSize: 12 }}>
            Designed by <span style={{ color: COLORS.accent, fontWeight: 600 }}>Nguyen Quoc Nhu</span> - <span style={{ color: COLORS.textSecondary, fontWeight: 500 }}>NFC Tap</span>
          </Text>
        </div>
      </motion.div>
    </div>
  );
}
