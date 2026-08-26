import React from "react";

type SkeletonProps = {
  variant?: "text" | "title" | "card";
  width?: string;
  className?: string;
};

export default function Skeleton({ variant = "text", width, className = "" }: SkeletonProps) {
  const style: React.CSSProperties = width ? { width } : {};

  if (variant === "title") {
    return <div className={`skeleton skeleton-title ${className}`} style={style} />;
  }
  if (variant === "card") {
    return <div className={`skeleton skeleton-card ${className}`} style={style} />;
  }
  return <div className={`skeleton skeleton-text ${className}`} style={style} />;
}
