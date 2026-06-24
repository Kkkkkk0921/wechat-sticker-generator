import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "微信表情包生成器",
  description: "输入角色设定，一次生成 5 张微信表情包。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
