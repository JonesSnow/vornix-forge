"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import React from "react";

export default function NavAuth() {
  const { isSignedIn } = useAuth();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <a
            href="/sign-in"
            style={{
              fontSize: 13,
              color: "#A0A0A0",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F2F0EB";
              e.currentTarget.style.background = "#1A1A1A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#A0A0A0";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Login
          </a>
          <a
            href="/sign-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "9px 20px",
              background: "#F2F0EB",
              color: "#0A0A0A",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E8A020")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F2F0EB")}
          >
            Start Free
          </a>
        </>
      )}
    </div>
  );
}
