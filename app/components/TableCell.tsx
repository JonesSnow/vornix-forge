import React from "react";

type TableCellProps = {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

export default function TableCell({ children, align = "left", className = "" }: TableCellProps) {
  return (
    <td align={align} className={className}>
      {children}
    </td>
  );
}
