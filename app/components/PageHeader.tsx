import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-3 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-text-muted">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="text-text-secondary hover:text-primary transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-primary font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h1 text-primary">{title}</h1>
          {subtitle && <p className="mt-2 text-body-sm text-text-secondary">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
