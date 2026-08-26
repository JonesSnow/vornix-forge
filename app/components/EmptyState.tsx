import React from "react";
import Button from "./Button";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
};

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-description">{description}</div>}
      {action && (
        <div className="empty-state-actions">
          {action.href ? (
            <a href={action.href}>
              <Button variant="secondary" size="sm">{action.label}</Button>
            </a>
          ) : (
            <Button variant="secondary" size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
