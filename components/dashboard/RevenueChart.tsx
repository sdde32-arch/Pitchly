import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
const data = [
  { name: "Jan", revenue: 1200000 },
  { name: "Feb", revenue: 1500000 },
  { name: "Mar", revenue: 1800000 },
  { name: "Apr", revenue: 1400000 },
  { name: "May", revenue: 2100000 },
  { name: "Jun", revenue: 2400000 },
];
export const RevenueChart: React.FC = () => {
  return (
    <div className="rounded-[12px] border border-border-subtle bg-surface-card p-4 shadow-sm">
      {" "}
      <div className="mb-6">
        {" "}
        <h3 className="text-sm font-semibold text-text-primary">
          {" "}
          Revenue Overview{" "}
        </h3>{" "}
        <p className="text-xs text-muted"> Monthly performance </p>{" "}
      </div>{" "}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-text-text-primary)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>{" "}
    </div>
  );
};
