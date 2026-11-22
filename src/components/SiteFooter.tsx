import Link from "next/link";
import { Logo } from "./SiteHeader";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            在真正上場之前，先和 AI 面試官預演一遍。每一次練習，都讓你更接近想要的那份工作。
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">產品</p>
          <Link href="/interview" className="hover:text-accent">開始面試</Link>
          <Link href="/#features" className="hover:text-accent">功能介紹</Link>
          <Link href="/#report" className="hover:text-accent">評估報告</Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">資源</p>
          <Link href="/#how" className="hover:text-accent">使用流程</Link>
          <Link href="/#faq" className="hover:text-accent">常見問題</Link>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 Rehearse 預演. All rights reserved.</p>
          <p className="font-display text-base italic">Practice the interview, not the panic.</p>
        </div>
      </div>
    </footer>
  );
}
