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
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: "#0A0A0A", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
      `}</style>

      <Link
        href="/"
        className="mb-10 text-[15px] font-extrabold tracking-[0.12em] text-[#F2F0EB] transition-opacity hover:opacity-80"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        VORNIX FORGE
      </Link>

      <SignUp appearance={vornixClerkAppearance} />
    </div>
  );
}
