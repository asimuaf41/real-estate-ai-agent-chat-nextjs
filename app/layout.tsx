import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthUrlErrorHandler } from "@/components/AuthUrlErrorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SupabaseConfigScript } from "@/components/SupabaseConfigScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL ??
      "http://localhost:3000",
  ),
  title: {
    default: `${PRODUCT_NAME} · AI Agent Workspace`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: PRODUCT_TAGLINE,
  applicationName: PRODUCT_NAME,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: `${PRODUCT_NAME} · AI Agent Workspace`,
    description: PRODUCT_TAGLINE,
    siteName: PRODUCT_NAME,
    type: "website",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: PRODUCT_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRODUCT_NAME} · AI Agent Workspace`,
    description: PRODUCT_TAGLINE,
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SupabaseConfigScript />
        <AuthUrlErrorHandler />
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
