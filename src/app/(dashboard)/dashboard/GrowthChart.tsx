"use client";

import { useTheme } from "@/components/providers/AntdProvider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface GrowthChartDatum {
  month: string;
  subscriptions: number;
  revenue: number;
}

export default function GrowthChart({ data }: { data: GrowthChartDatum[] }) {
  const { isDark } = useTheme();

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: isDark ? "#a0a0b0" : "#6e6e73" }}>
        No growth data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2e2e40" : "#f0f0f0"} />
        <XAxis
          dataKey="month"
          stroke={isDark ? "#a0a0b0" : "#6e6e73"}
          style={{ fontSize: 12 }}
        />
        <YAxis
          yAxisId="left"
          stroke={isDark ? "#a0a0b0" : "#6e6e73"}
          style={{ fontSize: 12 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={isDark ? "#a0a0b0" : "#6e6e73"}
          style={{ fontSize: 12 }}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: isDark ? "#1e1e2e" : "#fff",
            border: isDark ? "1px solid #2e2e40" : "1px solid #f0f0f0",
            borderRadius: 8,
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="subscriptions"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{ fill: "#4f46e5", r: 4 }}
          name="Subscriptions"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", r: 4 }}
          name="Revenue ($)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
