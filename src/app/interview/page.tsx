"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { API_KEY_HEADER, getApiKey, maskKey, openSettings, useApiKey } from "@/lib/apiKey";
import { INTERVIEWERS, INTERVIEWER_ORDER, interviewerForQuestion, type InterviewerId } from "@/lib/interviewers";

type ChatMessage = { role: "assistant" | "user"; content: string; interviewer?: InterviewerId };

type Evaluation = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  questionFeedback: {
    question: string;
    interviewer?: InterviewerId;
    answer: string;
    feedback: string;
    betterAnswer: string;
  }[];
  panelComments?: { interviewer: InterviewerId; comment: string }[];
};

const QUESTION_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

function scoreLabel(score: number) {
  if (score >= 85) return "表現優秀";
  if (score >= 70) return "表現良好";
  if (score >= 50) return "仍有進步空間";
  return "需要加強練習";
}

/* 面試官頭像：白臉為淺色、黑臉為深色 */
function InterviewerAvatar({ id, className = "size-9 text-sm" }: { id: InterviewerId; className?: string }) {
  const i = INTERVIEWERS[id];
  return (
    <span
      title={`${i.name}（${i.tag}）`}
      className={`grid shrink-0 place-items-center rounded-full font-display font-bold ${
        id === "bad" ? "bg-ink text-paper" : "border border-line bg-card text-ink"
      } ${className}`}
    >
      {i.initial}
    </span>
  );
}

function RoleTag({ id }: { id: InterviewerId }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        id === "bad" ? "bg-ink text-paper" : "border border-line bg-card text-ink"
      }`}
    >
      {INTERVIEWERS[id].tag}
    </span>
  );
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
  const [totalQuestions, setTotalQuestions] = useState(4);
  const [panel, setPanel] = useState<InterviewerId[]>(["good", "bad"]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 4 });
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [errorCode, setErrorCode] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const apiKey = useApiKey();

  const started = messages.length > 0;

  // 有新訊息時自動捲到最下方
  useEffect(() => {
    if (started) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, started]);

  async function callInterview(history: ChatMessage[]) {
    const key = getApiKey();
    if (!key) {
      setError("請先在設定中輸入你的 OpenAI API Key");
      setErrorCode("missing_api_key");
      openSettings();
      return;
    }
    setLoading(true);
    setError("");
    setErrorCode("");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json", [API_KEY_HEADER]: key },
        body: JSON.stringify({ jobDescription, messages: history, totalQuestions, interviewers: panel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorCode(data.code ?? "");
        throw new Error(data.error ?? "發生錯誤");
      }

      if (data.type === "evaluation") {
        setEvaluation(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setMessages([...history, { role: "assistant", content: data.question, interviewer: data.interviewer }]);
        setProgress({ current: data.questionNumber, total: data.totalQuestions });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  // 切換面試官（至少要保留一位），並維持白臉先、黑臉後的順序
  function togglePanel(id: InterviewerId) {
    setPanel((prev) => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      return INTERVIEWER_ORDER.filter((x) => x === id || prev.includes(x));
    });
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
    setErrorCode("");
    setProgress({ current: 0, total: totalQuestions });
  }

  const answeredCount = messages.filter((m) => m.role === "user").length;
  // 載入中時，下一位發言的面試官
  const nextSpeaker = interviewerForQuestion(panel, answeredCount + 1);
  const isGeneratingReport = answeredCount >= totalQuestions;

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
              <p className="mt-3 text-muted">選擇面試官、貼上職缺描述並選擇題數，AI 面試官會依此為你量身出題。</p>

              <div className="mt-10 rounded-3xl border border-line bg-card p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.4)] sm:p-8">
                <div
                  className={`mb-8 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${
                    apiKey ? "bg-paper-2" : "border border-accent/40 bg-accent-soft"
                  }`}
                >
                  {apiKey ? (
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-good" />
                      OpenAI API Key <code className="font-mono text-xs text-muted">{maskKey(apiKey)}</code>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-accent">
                      <span className="size-2 rounded-full bg-accent" />
                      開始前，請先設定你的 OpenAI API Key
                    </span>
                  )}
                  <button onClick={openSettings} className="shrink-0 text-xs font-medium underline underline-offset-4">
                    {apiKey ? "變更" : "前往設定"}
                  </button>
                </div>

                <p className="mb-3 flex items-center justify-between text-sm font-medium">
                  面試官
                  <span className="text-xs font-normal text-muted">
                    {panel.length > 1 ? "小組面試・兩位輪流提問" : "一對一面試"}
                  </span>
                </p>
                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  {INTERVIEWER_ORDER.map((id) => {
                    const i = INTERVIEWERS[id];
                    const on = panel.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => togglePanel(id)}
                        aria-pressed={on}
                        className={`relative flex gap-4 rounded-2xl border p-4 text-left transition-all ${
                          on ? "border-ink bg-paper shadow-[0_12px_30px_-20px_rgba(0,0,0,0.5)]" : "border-line bg-paper/40 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <InterviewerAvatar id={id} className="size-12 text-lg" />
                        <span className="flex-1">
                          <span className="flex items-center gap-2">
                            <span className="font-semibold">{i.name}</span>
                            <RoleTag id={id} />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">{i.title}</span>
                          <span className="mt-2 block text-xs leading-relaxed text-muted">{i.description}</span>
                        </span>
                        <span
                          className={`absolute top-3 right-3 grid size-5 place-items-center rounded-full border text-[10px] ${
                            on ? "border-accent bg-accent text-accent-ink" : "border-line"
                          }`}
                        >
                          {on && "✓"}
                        </span>
                      </button>
                    );
                  })}
                </div>

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
                  disabled={loading || !jobDescription.trim() || !apiKey}
                >
                  {loading ? "面試官準備中⋯⋯" : !apiKey ? "請先設定 API Key" : "進入面試室"}
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
                    {m.role === "assistant" ? (
                      <InterviewerAvatar id={m.interviewer ?? panel[0]} />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-medium text-accent">
                        你
                      </span>
                    )}
                    <div className={`flex max-w-[80%] flex-col gap-1.5 ${m.role === "user" ? "items-end" : ""}`}>
                      {m.role === "assistant" && (
                        <span className="flex items-center gap-2 text-xs text-muted">
                          {INTERVIEWERS[m.interviewer ?? panel[0]].name}
                          <RoleTag id={m.interviewer ?? panel[0]} />
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-5 py-4 leading-relaxed whitespace-pre-wrap ${
                          m.role === "assistant"
                            ? (m.interviewer ?? panel[0]) === "bad"
                              ? "rounded-tl-sm border border-ink/70 bg-card"
                              : "rounded-tl-sm border border-line bg-card"
                            : "rounded-tr-sm bg-ink text-paper"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-3">
                    {isGeneratingReport ? (
                      <span className="grid size-9 place-items-center rounded-full bg-ink text-paper">
                        <span className="font-display text-base italic">R</span>
                      </span>
                    ) : (
                      <InterviewerAvatar id={nextSpeaker} />
                    )}
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-card px-5 py-4">
                      <span className="dot-blink size-1.5 rounded-full bg-muted" />
                      <span className="dot-blink size-1.5 rounded-full bg-muted [animation-delay:0.15s]" />
                      <span className="dot-blink size-1.5 rounded-full bg-muted [animation-delay:0.3s]" />
                      <span className="ml-2 text-sm text-muted">
                        {isGeneratingReport ? "面試官們正在討論評估報告" : `${INTERVIEWERS[nextSpeaker].name}思考中`}
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

              {evaluation.panelComments && evaluation.panelComments.length > 0 && (
                <div className={`grid gap-4 ${evaluation.panelComments.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {evaluation.panelComments.map((c) => (
                    <figure
                      key={c.interviewer}
                      className={`flex flex-col gap-4 rounded-3xl p-6 ${
                        c.interviewer === "bad" ? "bg-ink text-paper" : "border border-line bg-card"
                      }`}
                    >
                      <blockquote className="font-display text-lg leading-relaxed">「{c.comment}」</blockquote>
                      <figcaption className="mt-auto flex items-center gap-3 text-sm">
                        <InterviewerAvatar
                          id={c.interviewer}
                          className={`size-8 text-sm ${c.interviewer === "bad" ? "ring-1 ring-paper/30" : ""}`}
                        />
                        <span>
                          {INTERVIEWERS[c.interviewer].name}
                          <span className="ml-2 text-xs opacity-60">
                            {INTERVIEWERS[c.interviewer].tag} · {INTERVIEWERS[c.interviewer].title}
                          </span>
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}

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
                        <div className="flex-1">
                          {q.interviewer && (
                            <span className="mb-2 flex items-center gap-2 text-xs text-muted">
                              {INTERVIEWERS[q.interviewer].name} 提問
                              <RoleTag id={q.interviewer} />
                            </span>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{q.question}</p>
                        </div>
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
              {(errorCode === "missing_api_key" || errorCode === "invalid_api_key") && (
                <button className="shrink-0 underline underline-offset-4" onClick={openSettings}>
                  開啟設定
                </button>
              )}
              {started && !evaluation && !loading && errorCode !== "missing_api_key" && errorCode !== "invalid_api_key" && (
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
