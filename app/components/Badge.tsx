import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "neutral" | "accent" | "positive" | "negative" | "outline";
  className?: string;
};

export default function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
}
