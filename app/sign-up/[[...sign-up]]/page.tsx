import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { vornixClerkAppearance } from "@/lib/clerk-appearance";

export const metadata: Metadata = {
  title: "Sign Up — Vornix Forge",
  description: "Create your Vornix Forge trader development account.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background">
      <Link
        href="/"
        className="mb-10 text-[15px] font-extrabold tracking-[0.12em] text-primary transition-opacity hover:opacity-80"
        style={{ fontFamily: "var(--font-display)" }}
      >
        VORNIX FORGE
      </Link>

      <SignUp appearance={vornixClerkAppearance} fallbackRedirectUrl="/onboarding" />
    </div>
  );
}
