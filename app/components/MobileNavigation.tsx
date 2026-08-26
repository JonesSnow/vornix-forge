"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { navItems, levelCopy } from "@/lib/constants/content/dashboard-content";
import type { AssessmentStorage } from "@/lib/types";

function getLevelFromScore(score: number) {
  if (score <= 40) return 1;
  if (score <= 60) return 2;
  if (score <= 80) return 3;
  return 4;
}

type MobileNavigationProps = {
  open: boolean;
  onClose: () => void;
  activeLabel?: string;
};

export default function MobileNavigation({ open, onClose, activeLabel }: MobileNavigationProps) {
  const { user } = useUser();
  const [assessment, setAssessment] = React.useState<AssessmentStorage | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem("vornix_assessment");
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAssessment(JSON.parse(raw) as AssessmentStorage);
      } catch {
        setAssessment(null);
      }
    }
  }, []);

  const assessmentScore = assessment?.result?.score ?? assessment?.score ?? 0;
  const currentLevel = assessment?.result?.level ?? assessment?.level ?? getLevelFromScore(assessmentScore);
  const levelEntry = levelCopy[currentLevel] ?? levelCopy[1];

  const profileName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  const initial = profileName.charAt(0).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60]
          transition-opacity duration-200 lg:hidden
          ${open ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[70] w-[280px] bg-surface border-r border-border shadow-modal
          transform transition-transform duration-200 lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-subtle">
          <span className="font-display text-sm font-bold tracking-[0.15em] text-primary">
            VORNIX FORGE
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.label === activeLabel;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center h-10 px-3 rounded-lg text-sm font-medium transition-all
                  ${
                    isActive
                      ? "bg-accent-soft text-accent-hover border-l-[3px] border-accent"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-primary border-l-[3px] border-transparent"
                  }
                `}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-border-subtle">
          <div className="flex items-center gap-3 px-3 py-3 bg-surface-elevated border border-border rounded-xl">
            <div
              className="w-8 h-8 rounded-full bg-accent-soft border border-accent-subtle flex items-center justify-center text-accent-hover font-bold text-sm flex-shrink-0 font-display"
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary truncate">{profileName}</div>
              <div className="text-[11px] font-semibold text-accent-hover uppercase tracking-wider">{levelEntry.name}</div>
            </div>
            <div className="flex-shrink-0">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
