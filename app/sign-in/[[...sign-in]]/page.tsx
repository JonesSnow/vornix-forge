import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { vornixClerkAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = {
  title: "Sign In — Vornix Forge",
  description: "Sign in to your Vornix Forge trader development account.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <Link
        href="/"
        className="mb-10 text-[15px] font-extrabold tracking-[0.12em] text-primary transition-opacity hover:opacity-80"
        style={{ fontFamily: "var(--font-display)" }}
      >
        VORNIX FORGE
      </Link>

      <SignIn appearance={vornixClerkAppearance} fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
