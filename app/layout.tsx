import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthUrlErrorHandler } from "@/components/AuthUrlErrorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SupabaseConfigScript } from "@/components/SupabaseConfigScript";
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
  title: "AI Agent Workspace",
  description: "Premium B2B assistants for research, real estate, and weather",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SupabaseConfigScript />
        <AuthUrlErrorHandler />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
