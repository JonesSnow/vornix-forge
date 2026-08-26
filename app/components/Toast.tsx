"use client";

import React, { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

export default function Toast({ message, type = "info", duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: "bg-positive text-white",
    error: "bg-negative text-white",
    info: "bg-primary text-white",
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[80]
        ${colors[type]}
        px-5 py-3 rounded-lg shadow-dropdown
        text-sm font-medium
        transform transition-all duration-200
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 200);
          }}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
