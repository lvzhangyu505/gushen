import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 投研助手",
  description: "个人自用的 AI 投研信息与投资建议平台预览",
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
