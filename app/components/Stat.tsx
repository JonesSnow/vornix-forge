import React from "react";

type StatProps = {
  label: string;
  value: string | number;
  change?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  className?: string;
};

export default function Stat({ label, value, change, className }: StatProps) {
  const changeColor = change?.direction === "up" ? "text-positive" : change?.direction === "down" ? "text-negative" : "text-text-secondary";

  return (
    <div className={className}>
      <div className="text-caption text-text-secondary mb-2">{label}</div>
      <div className="font-display text-3xl font-bold text-primary leading-tight">{value}</div>
      {change && (
        <div className={`mt-2 text-sm font-medium ${changeColor}`}>
          {change.direction === "up" ? "↑" : change.direction === "down" ? "↓" : "→"} {change.value}
          {change.label && <span className="text-text-muted font-normal ml-1">{change.label}</span>}
        </div>
      )}
    </div>
  );
}
