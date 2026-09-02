import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
interface StatCardProps {
  label: string;
  value: string;
  trend?: "up" | "down";
  trendValue?: string;
}
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  trendValue,
}) => {
  const isPositive = trend === "up";
  return (
    <div className="flex flex-col rounded-[12px] border border-border-subtle bg-surface-card p-4 shadow-sm">
      {" "}
      <h3 className="text-sm font-medium text-muted"> {label} </h3>{" "}
      <div className="mt-3 flex items-baseline gap-3">
        {" "}
        <span className="text-3xl font-bold tracking-tight text-text-primary">
          {" "}
          {value}{" "}
        </span>{" "}
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
          >
            {" "}
            {isPositive ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.5} />
            )}{" "}
            <span>{trendValue}</span>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
};
