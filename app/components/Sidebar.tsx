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
    <aside className="fixed inset-y-0 left-0 z-50 w-[220px] bg-[#0A0A0A] border-r border-[#222222] flex flex-col">
      <div className="p-5">
        <div
          className="font-display text-[13px] font-bold tracking-[0.15em] text-[#F2F0EB]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          VORNIX FORGE
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.label === activeLabel;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`
                flex items-center h-[40px] px-3 rounded-[12px] text-sm font-medium transition-all
                ${isActive
                  ? "bg-[#1A1A1A] text-[#E8A020] border-l-2 border-[#E8A020]"
                  : "text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F2F0EB]"
                }
              `}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#222222]">
        <div className="flex items-center gap-3 px-3 py-3 bg-[#111111] border border-[#222222] rounded-xl">
          <div
            className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#E8A020] font-bold text-sm flex-shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#F2F0EB] truncate">{profileName}</div>
            <div className="text-[11px] font-semibold text-[#E8A020] uppercase tracking-wider">{levelEntry.name}</div>
          </div>
          <div className="flex-shrink-0">
            <UserButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
