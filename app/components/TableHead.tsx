import React from "react";

export default function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}
