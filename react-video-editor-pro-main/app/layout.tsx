import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "./reactvideoeditor/pro/components/ui/toaster";
import { PostHogProvider } from "./reactvideoeditor/pro/components/providers/posthog-provider";

export const metadata: Metadata = {
  title: "智剪PRO",
  description: "智剪PRO 视频编辑",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <PostHogProvider>
            <main>
              {children}
              <Toaster />
            </main>
        </PostHogProvider>
      </body>
    </html>
  );
}
