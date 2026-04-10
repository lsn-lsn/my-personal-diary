import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5deab",
};

export const metadata: Metadata = {
  title: {
    default: "梨树贴吧",
    template: "%s | 梨树贴吧",
  },
  description: "梨树贴吧 - 一个温暖的社区，分享你的日常和心情",
  keywords: ["贴吧", "社区", "日记", "分享", "梨树"],
  authors: [{ name: "梨树贴吧" }],
  openGraph: {
    title: "梨树贴吧",
    description: "梨树贴吧 - 一个温暖的社区，分享你的日常和心情",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍐</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
