import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import SettingsDialog from "@/components/SettingsDialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 標題用的西文襯線字
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// 標題用的中文襯線字（中文字檔大，不預先載入）
const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif",
  weight: ["500", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Rehearse 預演 — AI 模擬面試",
  description: "貼上職缺描述，AI 面試官逐題提問，結束後給你評分、點評與每題的較佳回答示範。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <SettingsDialog />
      </body>
    </html>
  );
}
