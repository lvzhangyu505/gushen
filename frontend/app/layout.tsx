import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gushen 研究工作台",
  description: "个人自用的 AI 股票研究辅助工作台预览",
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
