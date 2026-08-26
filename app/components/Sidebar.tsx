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

type SidebarProps = {
  activeLabel?: string;
};

export default function Sidebar({ activeLabel }: SidebarProps) {
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
    <aside className="fixed inset-y-0 left-0 z-50 w-[240px] bg-surface border-r border-border flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border-subtle">
        <span className="font-display text-sm font-bold tracking-[0.15em] text-primary">
          VORNIX FORGE
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.label === activeLabel;
          return (
            <a
              key={item.label}
              href={item.href}
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
    </aside>
  );
}
