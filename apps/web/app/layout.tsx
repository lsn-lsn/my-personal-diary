import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "梨树贴吧",
  description: "梨树贴吧 - 大家都可以发帖",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
