import React from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className || ""}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-h2 text-primary">{title}</h2>
          {description && <p className="mt-1 text-body-sm text-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
