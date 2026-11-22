import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-full bg-ink text-paper transition-transform group-hover:-rotate-12">
        <span className="font-display text-lg leading-none italic">R</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl leading-none">Rehearse</span>
        <span className="text-xs tracking-[0.2em] text-muted">預演</span>
      </span>
    </Link>
  );
}

export default function SiteHeader({ variant = "landing" }: { variant?: "landing" | "app" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        {variant === "landing" ? (
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition-colors hover:text-ink">功能</a>
            <a href="#how" className="transition-colors hover:text-ink">使用流程</a>
            <a href="#report" className="transition-colors hover:text-ink">評估報告</a>
            <a href="#faq" className="transition-colors hover:text-ink">常見問題</a>
          </nav>
        ) : (
          <span className="hidden items-center gap-2 text-sm text-muted md:flex">
            <span className="size-1.5 rounded-full bg-good" />
            面試室
          </span>
        )}

        {variant === "landing" ? (
          <Link
            href="/interview"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent hover:text-accent-ink"
          >
            開始模擬面試
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        ) : (
          <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
            ← 回到首頁
          </Link>
        )}
      </div>
    </header>
  );
}
