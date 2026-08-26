import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  success?: string;
};

export default function Input({ label, error, success, className = "", ...props }: InputProps) {
  const stateClass = error ? "input-error" : success ? "input-success" : "";

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input className={`input ${stateClass} ${className}`} {...props} />
      {error && <p className="mt-1.5 text-sm text-negative">{error}</p>}
      {success && <p className="mt-1.5 text-sm text-positive">{success}</p>}
    </div>
  );
}
