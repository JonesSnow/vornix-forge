import React from "react";

type TableRowProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function TableRow({ children, className = "", onClick }: TableRowProps) {
  return (
    <tr
      className={`
        border-b border-border-subtle transition-colors
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
