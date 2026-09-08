import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppHeader } from "@/components/layout/app-header";
import { AppProviders } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baseline — Speech & Presentation Coach",
  description:
    "Practice interviews, presentations, and speech recovery with Baseline. Modular professional and clinical modes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <AppProviders>
          <AppHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
