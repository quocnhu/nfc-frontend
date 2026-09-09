"use client";

import { Spin } from "antd";

export default function TranslationLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Spin size="large" />
    </div>
  );
}