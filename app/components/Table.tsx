import React from "react";

type TableProps = {
  children: React.ReactNode;
  striped?: boolean;
  className?: string;
};

export default function Table({ children, striped = false, className = "" }: TableProps) {
  const stripedClass = striped ? "table-striped" : "";

  return (
    <div className="table-wrapper">
      <table className={`table ${stripedClass} ${className}`}>{children}</table>
    </div>
  );
}
