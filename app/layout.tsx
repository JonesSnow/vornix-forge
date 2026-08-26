import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Syne, Inter } from "next/font/google";
import { vornixClerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Vornix Forge — Trader Development Platform",
  description: "The world's first structured trader development system. Assessed at entry, developed systematically, certified by competence.",
  openGraph: {
    title: "Vornix Forge — Trader Development Platform",
    description: "The world's first structured trader development system. Assessed at entry, developed systematically, certified by competence.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={vornixClerkAppearance}>
      <html lang="en" className={`${syne.variable} ${inter.variable}`}>
        <body className="min-h-screen bg-background text-primary font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
