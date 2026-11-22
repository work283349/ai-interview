"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type ChatMessage = { role: "assistant" | "user"; content: string };

type Evaluation = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  questionFeedback: {
    question: string;
    answer: string;
    feedback: string;
    betterAnswer: string;
  }[];
};

const QUESTION_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

function scoreLabel(score: number) {
  if (score >= 85) return "表現優秀";
  if (score >= 70) return "表現良好";
  if (score >= 50) return "仍有進步空間";
  return "需要加強練習";
}

/* 圓環分數 */
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-5xl leading-none">{score}</p>
          <p className="font-mono text-[10px] tracking-widest text-muted">/ 100</p>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 3 });
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const started = messages.length > 0;

  // 有新訊息時自動捲到最下方
  useEffect(() => {
    if (started) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, started]);

  async function callInterview(history: ChatMessage[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, messages: history, totalQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "發生錯誤");

      if (data.type === "evaluation") {
        setEvaluation(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setMessages([...history, { role: "assistant", content: data.question }]);
        setProgress({ current: data.questionNumber, total: data.totalQuestions });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    if (!jobDescription.trim()) return;
    callInterview([]);
  }

  function handleSubmitAnswer() {
    if (!answer.trim() || loading) return;
    const history: ChatMessage[] = [...messages, { role: "user", content: answer.trim() }];
    setMessages(history);
    setAnswer("");
    callInterview(history);
  }

  function handleReset() {
    setMessages([]);
    setAnswer("");
    setEvaluation(null);
    setError("");
    setProgress({ current: 0, total: totalQuestions });
  }

  const progressPct = evaluation ? 100 : (Math.max(progress.current - 1, 0) / progress.total) * 100;

  return (
    <>
      <SiteHeader variant="app" />

      <main className="bg-dots flex-1 px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {/* ── 設定階段 ── */}
          {!started && (
            <section className="animate-rise">
              <p className="mb-3 font-mono text-xs tracking-widest text-accent uppercase">Step 1 · Setup</p>
              <h1 className="font-display text-4xl font-bold sm:text-5xl">準備你的面試</h1>
              <p className="mt-3 text-muted">貼上職缺描述並選擇題數，AI 面試官會依此為你量身出題。</p>

              <div className="mt-10 rounded-3xl border border-line bg-card p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.4)] sm:p-8">
                <label className="mb-2 flex items-center justify-between text-sm font-medium">
                  職缺描述
                  <span className="font-mono text-xs font-normal text-muted">{jobDescription.length} 字</span>
                </label>
                <textarea
                  className="min-h-56 w-full resize-y rounded-2xl border border-line bg-paper p-4 leading-relaxed outline-none transition-colors placeholder:text-muted/70 focus:border-ink"
                  placeholder="例如：前端工程師，負責公司核心產品的介面開發。熟悉 React、TypeScript，有效能優化經驗者佳⋯⋯"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />

                <p className="mt-8 mb-3 text-sm font-medium">面試題數</p>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {QUESTION_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTotalQuestions(n)}
                      aria-pressed={totalQuestions === n}
                      className={`h-11 rounded-xl border font-mono text-sm transition-all ${
                        totalQuestions === n
                          ? "border-ink bg-ink text-paper"
                          : "border-line bg-paper text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">預估約 {totalQuestions * 3} 分鐘</p>

                <button
                  className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-accent px-6 py-4 font-medium text-accent-ink transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                  onClick={handleStart}
                  disabled={loading || !jobDescription.trim()}
                >
                  {loading ? "面試官準備中⋯⋯" : "進入面試室"}
                  {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
                </button>
              </div>
            </section>
          )}

          {/* ── 面試進行中 ── */}
          {started && !evaluation && (
            <section className="flex flex-col gap-6">
              <div className="sticky top-16 z-10 -mx-4 bg-paper/85 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-mono text-xs tracking-widest text-muted uppercase">Interview in progress</span>
                  <span className="font-mono text-xs">
                    Q <span className="text-accent">{progress.current}</span> / {progress.total}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`animate-rise flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium ${
                        m.role === "assistant" ? "bg-ink text-paper" : "border border-line bg-card"
                      }`}
                    >
                      {m.role === "assistant" ? <span className="font-display text-base italic">R</span> : "你"}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 leading-relaxed whitespace-pre-wrap ${
                        m.role === "assistant"
                          ? "rounded-tl-sm border border-line bg-card"
                          : "rounded-tr-sm bg-ink text-paper"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-ink text-paper">
                      <span className="font-display text-base italic">R</span>
                    </span>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-card px-5 py-4">
                      <span className="dot-blink size-1.5 rounded-full bg-muted" />
                      <span className="dot-blink size-1.5 rounded-full bg-muted [animation-delay:0.15s]" />
                      <span className="dot-blink size-1.5 rounded-full bg-muted [animation-delay:0.3s]" />
                      <span className="ml-2 text-sm text-muted">
                        {messages.filter((m) => m.role === "user").length >= totalQuestions ? "正在產生評估報告" : "面試官思考中"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!loading && (
                <div className="rounded-3xl border border-line bg-card p-4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.4)] focus-within:border-ink">
                  <textarea
                    className="min-h-32 w-full resize-y bg-transparent p-2 leading-relaxed outline-none placeholder:text-muted/70"
                    placeholder="輸入你的回答⋯⋯"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSubmitAnswer();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="hidden font-mono text-xs text-muted sm:inline">⌘ / Ctrl + Enter 送出</span>
                    <button
                      className="ml-auto rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition-opacity disabled:opacity-40"
                      onClick={handleSubmitAnswer}
                      disabled={!answer.trim()}
                    >
                      送出回答 →
                    </button>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </section>
          )}

          {/* ── 評估報告 ── */}
          {evaluation && (
            <section className="animate-rise flex flex-col gap-8">
              <div>
                <p className="mb-3 font-mono text-xs tracking-widest text-accent uppercase">Your report</p>
                <h1 className="font-display text-4xl font-bold sm:text-5xl">面試評估報告</h1>
              </div>

              <div className="flex flex-col items-center gap-8 rounded-3xl border border-line bg-card p-6 sm:flex-row sm:p-8">
                <ScoreRing score={evaluation.score} />
                <div>
                  <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs text-accent">
                    {scoreLabel(evaluation.score)}
                  </span>
                  <p className="mt-3 text-lg leading-relaxed">{evaluation.summary}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-line bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-good">
                    <span className="grid size-6 place-items-center rounded-full bg-good-soft text-xs">✓</span>
                    優點
                  </h3>
                  <ul className="flex flex-col gap-3 text-sm leading-relaxed">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="border-l-2 border-good/40 pl-3">{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-line bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-warn">
                    <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-xs">↑</span>
                    改進建議
                  </h3>
                  <ul className="flex flex-col gap-3 text-sm leading-relaxed">
                    {evaluation.improvements.map((s, i) => (
                      <li key={i} className="border-l-2 border-warn/40 pl-3">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="mb-4 font-display text-3xl font-bold">逐題回顧</h2>
                <div className="flex flex-col gap-4">
                  {evaluation.questionFeedback.map((q, i) => (
                    <details key={i} open={i === 0} className="group rounded-3xl border border-line bg-card">
                      <summary className="flex cursor-pointer list-none items-start gap-4 p-6">
                        <span className="font-display text-3xl leading-none text-accent italic">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="flex-1 leading-relaxed whitespace-pre-wrap">{q.question}</p>
                        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-sm transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <div className="flex flex-col gap-4 px-6 pb-6">
                        <div className="rounded-2xl bg-paper-2 p-4 text-sm">
                          <span className="mb-1 block font-mono text-[10px] tracking-widest text-muted uppercase">你的回答</span>
                          <span className="leading-relaxed whitespace-pre-wrap">{q.answer}</span>
                        </div>
                        {q.feedback && (
                          <p className="text-sm leading-relaxed">
                            <span className="font-semibold">點評　</span>
                            <span className="text-muted">{q.feedback}</span>
                          </p>
                        )}
                        {q.betterAnswer && (
                          <div className="rounded-2xl bg-good-soft p-4 text-sm">
                            <span className="mb-1 block text-xs font-semibold text-good">建議回答方式</span>
                            <span className="leading-relaxed whitespace-pre-wrap">{q.betterAnswer}</span>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <button
                className="self-center rounded-full border border-ink px-6 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-paper"
                onClick={handleReset}
              >
                再練一場 ↺
              </button>
            </section>
          )}

          {error && (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent-soft px-5 py-4 text-sm text-accent">
              <span>{error}</span>
              {started && !evaluation && !loading && (
                <button className="shrink-0 underline underline-offset-4" onClick={() => callInterview(messages)}>
                  重試
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
