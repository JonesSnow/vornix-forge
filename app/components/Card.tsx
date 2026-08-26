import React from "react";

type CardProps = {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "sunken";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  className?: string;
};

const paddingMap = {
  none: "0",
  sm: "var(--space-4)",
  md: "var(--space-5)",
  lg: "var(--space-6)",
};

export default function Card({ children, variant = "default", padding = "md", hoverable = false, className = "" }: CardProps) {
  const variantClass = variant === "default" ? "card" : `card-${variant}`;
  const hoverClass = hoverable ? "hover:border-border-visible" : "";

  return (
    <div
      className={`${variantClass} ${hoverClass} ${className}`}
      style={{ padding: paddingMap[padding] }}
    >
      {children}
    </div>
  );
}
