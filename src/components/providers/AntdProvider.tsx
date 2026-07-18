"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme } from "antd";
import { useState, useEffect, createContext, useContext } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setIsDark(saved === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#4f46e5",
            borderRadius: 8,
            colorBgContainer: isDark ? "#1e1e2e" : "#ffffff",
            colorBgLayout: isDark ? "#121220" : "#f0f2f5",
            colorBgElevated: isDark ? "#252536" : "#ffffff",
            colorBorder: isDark ? "#2e2e40" : "#e0e0e6",
            colorText: isDark ? "#e0e0e8" : "#1a1a2e",
            colorTextSecondary: isDark ? "#a0a0b0" : "#555770",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Layout: {
              headerBg: isDark ? "#1a1a2e" : "#ffffff",
              siderBg: isDark ? "#10101e" : "#001529",
              bodyBg: isDark ? "#121220" : "#f0f2f5",
            },
            Menu: {
              darkItemBg: isDark ? "#10101e" : "#001529",
              darkSubMenuItemBg: isDark ? "#0d0d1a" : "#000c17",
              darkItemSelectedBg: "#4f46e5",
              darkItemHoverBg: isDark ? "#252540" : "#111d42",
            },
            Card: {
              colorBgContainer: isDark ? "#1e1e2e" : "#ffffff",
              borderRadiusLG: 12,
            },
            Table: {
              colorBgContainer: isDark ? "#1e1e2e" : "#ffffff",
              headerBg: isDark ? "#252536" : "#4f46e5",
              headerColor: isDark ? "#e0e0e8" : "#ffffff",
              rowHoverBg: isDark ? "#252540" : "rgba(79, 70, 229, 0.04)",
              borderColor: isDark ? "#2e2e40" : "#e8e8ee",
              colorText: isDark ? "#e0e0e8" : "#1a1a2e",
              colorTextSecondary: isDark ? "#a0a0b0" : "#555770",
            },
            Button: {
              primaryShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
            },
            Tabs: {
              inkBarColor: "#4f46e5",
              itemSelectedColor: "#4f46e5",
            },
            Input: {
              activeBorderColor: "#4f46e5",
              hoverBorderColor: "#7c7cf7",
            },
            Select: {
              optionSelectedBg: "rgba(79, 70, 229, 0.08)",
            },
            Tag: {
              borderRadiusSM: 6,
            },
          },
        }}
      >
        <ThemeContext.Provider value={{ isDark, toggle }}>
          {children}
        </ThemeContext.Provider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
