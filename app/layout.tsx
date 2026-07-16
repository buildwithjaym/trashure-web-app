import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";
import { DownloadApkPrompt } from "@/components/download-apk-prompt";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trashure | Turn Trash Into Treasure",

  description:
    "AI-powered circular economy platform transforming waste into valuable resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}

        <DownloadApkPrompt />

        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}