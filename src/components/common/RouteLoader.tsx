"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useTheme } from "@/components/providers/AntdProvider";

const SHOW_DELAY = 150;
const ROUTE_SETTLE_MS = 300;

export function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (pathname === previousPath.current) return;
    previousPath.current = pathname;
    setLoading(true);
  }, [pathname]);

  // Only reveal the overlay after SHOW_DELAY; hide immediately (in cleanup)
  // as soon as the route finishes — no forced minimum display time.
  useEffect(() => {
    if (!loading) return;
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY);
    const settleTimer = setTimeout(() => setLoading(false), ROUTE_SETTLE_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(settleTimer);
      setVisible(false);
    };
  }, [loading]);

  useEffect(() => {
    setLoading(false);
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "rgba(18, 18, 32, 0.75)" : "rgba(255, 255, 255, 0.75)",
        zIndex: 9999,
      }}
    >
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        size="large"
      />
    </div>
  );
}
