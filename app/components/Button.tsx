import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base = "btn";
  const variantClass = `${base}-${variant}`;
  const sizeClass = size !== "md" ? `${base}-${size}` : "";

  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      )}
      {children}
    </button>
  );
}
