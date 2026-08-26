import React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`
          relative bg-surface border border-border rounded-xl shadow-modal
          w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto
        `}
      >
        {(title || description) && (
          <div className="px-6 py-5 border-b border-border-subtle">
            {title && <h3 className="text-h3 text-primary">{title}</h3>}
            {description && <p className="mt-1 text-body-sm text-text-secondary">{description}</p>}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
