import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SystemStatusFooter } from "@/components/layout/system-status-footer";
import { ThemeProvider } from "@/components/theme/theme-provider";
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
  title: "Mock Interview Pro",
  description: "AI-powered mock interviews with real-time feedback",
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
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          {children}
          <SystemStatusFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
