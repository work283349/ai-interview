import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const features = [
  {
    no: "01",
    title: "依職缺量身出題",
    body: "貼上任何職缺描述，AI 面試官會根據職責與技能要求設計題目，不是千篇一律的題庫。",
  },
  {
    no: "02",
    title: "像真人一樣追問",
    body: "每回答一題，面試官會先給一句回饋，再針對你的內容深入追問，逼出你真正的實力。",
  },
  {
    no: "03",
    title: "百分制整體評分",
    body: "面試結束立即產出 0–100 分評分與整體總結，清楚知道自己現在站在哪裡。",
  },
  {
    no: "04",
    title: "逐題示範較佳回答",
    body: "每一題都有優缺點點評，並以第一人稱示範更好的回答方式，直接拿去練。",
  },
];

const steps = [
  { title: "設定 Key", body: "在設定輸入你的 OpenAI API Key，只存在你的瀏覽器。" },
  { title: "貼上職缺", body: "複製你想應徵的職缺描述，貼進面試室。" },
  { title: "逐題作答", body: "選擇 1–10 題，像真正的面試一樣一題一題回答。" },
  { title: "拿到報告", body: "取得評分、優點、改進建議與逐題示範。" },
];

const faqs = [
  {
    q: "需要註冊帳號嗎？",
    a: "不需要。只要準備好你自己的 OpenAI API Key，在右上角的設定輸入後，就能直接開始面試。",
  },
  {
    q: "為什麼要用自己的 API Key？安全嗎？",
    a: "Rehearse 採用 BYOK（Bring Your Own Key）模式，費用直接由你的 OpenAI 帳戶計算。Key 只存在你的瀏覽器 localStorage，面試時隨請求傳給伺服器轉送 OpenAI，伺服器不會保存。",
  },
  {
    q: "支援哪些職缺類型？",
    a: "任何職缺都可以——工程、設計、行銷、業務、營運⋯⋯題目完全依照你貼上的職缺描述產生。",
  },
  {
    q: "我的回答會被保存嗎？",
    a: "面試紀錄只存在你的瀏覽器分頁中，重新整理或按下「重新開始」就會清除。",
  },
  {
    q: "一場面試需要多久？",
    a: "取決於你選擇的題數。3 題大約 10 分鐘，10 題的完整模擬約 30 分鐘。",
  },
];

function CTAButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Link
      href="/interview"
      className={`group inline-flex items-center justify-center gap-3 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-accent-ink shadow-[0_10px_30px_-10px] shadow-accent/60 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px] ${className}`}
    >
      {children}
      <span className="grid size-6 place-items-center rounded-full bg-accent-ink/15 transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}

/* 首頁主視覺右側的產品示意卡 */
function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent-soft/70 blur-2xl" />
      <div className="rotate-1 rounded-3xl border border-line bg-card p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
          </div>
          <span className="font-mono text-[11px] tracking-wider text-muted">Q 2 / 5</span>
        </div>
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full w-2/5 rounded-full bg-accent" />
        </div>
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-paper-2 px-4 py-3">
            <span className="mb-1 block font-mono text-[10px] tracking-widest text-muted uppercase">Interviewer</span>
            很好的例子。你提到重構了狀態管理，可以具體說明當時如何評估 Redux 與 Context 的取捨嗎？
          </div>
          <div className="max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-ink px-4 py-3 text-paper">
            <span className="mb-1 block font-mono text-[10px] tracking-widest uppercase opacity-60">You</span>
            當時頁面有大量跨元件的共享狀態，所以我先量測了重新渲染次數⋯⋯
          </div>
          <div className="flex items-center gap-1.5 px-2 text-muted">
            <span className="dot-blink size-1.5 rounded-full bg-muted" />
            <span className="dot-blink size-1.5 rounded-full bg-muted [animation-delay:0.15s]" />
            <span className="dot-blink size-1.5 rounded-full bg-muted [animation-delay:0.3s]" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-6 -rotate-3 rounded-2xl border border-line bg-card px-5 py-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)] sm:-left-10">
        <p className="font-mono text-[10px] tracking-widest text-muted uppercase">Score</p>
        <p className="font-display text-5xl leading-none">
          86<span className="text-xl text-muted">/100</span>
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-dots relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-16 pb-24 sm:px-6 md:pt-24 lg:grid-cols-[1.1fr_1fr]">
            <div className="animate-rise">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
                <span className="size-1.5 rounded-full bg-accent" />
                AI 模擬面試 · 依職缺出題
              </p>
              <h1 className="font-display text-5xl leading-[1.15] font-bold tracking-tight sm:text-6xl lg:text-7xl">
                上場之前，
                <br />
                先<span className="relative inline-block text-accent">
                  預演
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden>
                    <path d="M2 8c40-6 120-8 196-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                一遍。
              </h1>
              <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">
                貼上職缺描述，AI 面試官逐題提問、即時追問，結束後給你評分、點評，以及每一題的較佳回答示範。
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <CTAButton>開始模擬面試</CTAButton>
                <a href="#how" className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">
                  看看怎麼運作
                </a>
              </div>
              <p className="mt-6 font-mono text-xs text-muted">免註冊 · 使用你自己的 OpenAI Key · 繁體中文</p>
            </div>

            <div className="animate-rise px-4 [animation-delay:0.15s] sm:px-10 lg:px-0">
              <HeroMock />
            </div>
          </div>
        </section>

        {/* ── 跑馬燈 ── */}
        <section className="overflow-hidden border-y border-line bg-ink py-4 text-paper">
          <div className="flex justify-center gap-10 font-display text-xl whitespace-nowrap italic sm:text-2xl">
            <span>Frontend</span><span className="text-accent">✦</span>
            <span>Product</span><span className="text-accent">✦</span>
            <span>Design</span><span className="text-accent">✦</span>
            <span>Marketing</span><span className="text-accent">✦</span>
            <span className="hidden sm:inline">Data</span><span className="hidden text-accent sm:inline">✦</span>
            <span className="hidden sm:inline">Sales</span>
          </div>
        </section>

        {/* ── 功能 ── */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 font-mono text-xs tracking-widest text-accent uppercase">Features</p>
                <h2 className="font-display text-4xl font-bold sm:text-5xl">不只是題庫，<br />是一位面試官。</h2>
              </div>
              <p className="max-w-sm text-muted">從出題、追問到評估，完整重現一場真實面試的節奏與壓力。</p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.no} className="group bg-card p-8 transition-colors hover:bg-paper sm:p-10">
                  <span className="font-display text-5xl text-line italic transition-colors group-hover:text-accent">{f.no}</span>
                  <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 使用流程 ── */}
        <section id="how" className="scroll-mt-20 bg-paper-2">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <p className="mb-3 font-mono text-xs tracking-widest text-accent uppercase">How it works</p>
            <h2 className="mb-14 font-display text-4xl font-bold sm:text-5xl">四個步驟，十分鐘一場。</h2>
            <ol className="grid gap-8 md:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="relative">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full border border-ink font-display text-xl">{i + 1}</span>
                    {i < steps.length - 1 && <span className="hidden h-px flex-1 bg-line md:block" />}
                  </div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 報告預覽 ── */}
        <section id="report" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 font-mono text-xs tracking-widest text-accent uppercase">The report</p>
              <h2 className="font-display text-4xl font-bold sm:text-5xl">知道哪裡好，<br />更知道怎麼更好。</h2>
              <p className="mt-6 max-w-md leading-relaxed text-muted">
                面試結束後，你會拿到一份完整的評估報告：整體分數、表現總結、優點與改進建議，以及每一題的點評和「如果是我會這樣答」的示範。
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-sm">
                {["0–100 分整體評分", "優點與改進建議清單", "逐題點評 + 較佳回答示範"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="grid size-5 place-items-center rounded-full bg-good-soft text-[11px] text-good">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-card p-6 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="flex items-end justify-between border-b border-line pb-6">
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-muted uppercase">Overall</p>
                  <p className="font-display text-7xl leading-none">82</p>
                </div>
                <span className="rounded-full bg-good-soft px-3 py-1 text-xs text-good">表現良好</span>
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-good">優點</p>
                  <p className="text-sm text-muted">能以具體數據支撐成果，回答結構清楚。</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-warn">改進</p>
                  <p className="text-sm text-muted">技術取捨的理由可以再說得更完整。</p>
                </div>
              </div>
              <div className="rounded-2xl bg-good-soft p-4 text-sm">
                <p className="mb-1 text-xs font-semibold text-good">建議回答方式</p>
                <p className="leading-relaxed">「我先釐清了三個限制條件：團隊熟悉度、狀態複雜度與效能需求，再依此做出選擇⋯⋯」</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <p className="mb-3 font-mono text-xs tracking-widest text-accent uppercase">FAQ</p>
              <h2 className="font-display text-4xl font-bold sm:text-5xl">常見問題</h2>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                    {f.q}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 pr-12 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 結尾 CTA ── */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-6 py-20 text-center text-paper sm:px-12">
            <div className="absolute -top-24 -right-24 size-72 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-accent/20 blur-3xl" />
            <p className="relative font-display text-2xl italic opacity-70">Your next interview starts here.</p>
            <h2 className="relative mt-4 font-display text-4xl font-bold sm:text-6xl">下一場面試，<br className="sm:hidden" />你已經準備好了。</h2>
            <div className="relative mt-10">
              <CTAButton>立即開始模擬面試</CTAButton>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
