"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import React from "react";

export default function NavAuth() {
  const { isSignedIn } = useAuth();

  return (
    <div className="nav-right">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <a href="/sign-in" className="btn-ghost">Login</a>
          <a href="/sign-up" className="btn-primary">Start Free</a>
        </>
      )}
    </div>
  );
}
