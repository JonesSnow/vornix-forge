import React from "react";

type ChartContainerProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function ChartContainer({ children, title, subtitle, actions, className = "" }: ChartContainerProps) {
  return (
    <div className={`chart-container ${className}`}>
      {(title || subtitle || actions) && (
        <div className="chart-container-header">
          <div>
            {title && <div className="chart-container-title">{title}</div>}
            {subtitle && <div className="chart-container-subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="w-full">{children}</div>
    </div>
  );
}
