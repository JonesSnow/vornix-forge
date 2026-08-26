"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";

type AppShellProps = {
  children: React.ReactNode;
  activeLabel?: string;
};

export default function AppShell({ children, activeLabel }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-primary antialiased">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-border-visible shadow-sm"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeLabel={activeLabel} />
      </div>

      {/* Mobile drawer */}
      <MobileNavigation open={sidebarOpen} onClose={() => setSidebarOpen(false)} activeLabel={activeLabel} />

      {/* Main content area */}
      <main className="lg:ml-[240px] min-h-screen">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
