import React from "react";

export default function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}
