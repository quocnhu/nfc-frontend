"use client";

import { Switch } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import { useTheme } from "./AntdProvider";

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <Switch
      checked={isDark}
      onChange={toggle}
      checkedChildren={<BulbOutlined />}
      unCheckedChildren={<BulbOutlined />}
    />
  );
}
