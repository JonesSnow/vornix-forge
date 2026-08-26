import React from "react";

type ProgressProps = {
  value: number;
  max?: number;
  variant?: "default" | "positive" | "negative";
  className?: string;
  showLabel?: boolean;
};

export default function Progress({ value, max = 100, variant = "default", className = "", showLabel = false }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const barClass = variant === "positive" ? "progress-bar-positive" : variant === "negative" ? "progress-bar-negative" : "";

  return (
    <div className={className}>
      <div className="progress-shell">
        <div className={`progress-bar ${barClass}`} style={{ width: `${percentage}%` }} />
      </div>
      {showLabel && (
        <div className="mt-1.5 text-right text-caption text-text-muted">{Math.round(percentage)}%</div>
      )}
    </div>
  );
}
