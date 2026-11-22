"use client";

import { useEffect, useRef, useState } from "react";
import { maskKey, onOpenSettings, setApiKey, useApiKey } from "@/lib/apiKey";

export default function SettingsDialog() {
  const savedKey = useApiKey();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () =>
      onOpenSettings(() => {
        setDraft("");
        setReveal(false);
        setSaved(false);
        setOpen(true);
      }),
    [],
  );

  // 開啟時聚焦輸入框，並支援 Esc 關閉
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const trimmed = draft.trim();
  const looksValid = trimmed.startsWith("sk-") && trimmed.length > 20;

  function handleSave() {
    if (!looksValid) return;
    setApiKey(trimmed);
    setDraft("");
    setSaved(true);
  }

  function handleClear() {
    setApiKey("");
    setSaved(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="animate-rise relative w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] sm:p-8"
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="關閉"
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-paper-2 hover:text-ink"
        >
          ✕
        </button>

        <p className="mb-2 font-mono text-xs tracking-widest text-accent uppercase">Settings</p>
        <h2 id="settings-title" className="font-display text-3xl font-bold">OpenAI API Key</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Rehearse 使用你自己的 OpenAI API Key（BYOK）。費用直接由你的 OpenAI 帳戶計算。
        </p>

        {/* 目前狀態 */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-paper-2 px-4 py-3 text-sm">
          {savedKey ? (
            <>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-good" />
                已設定 <code className="font-mono text-xs text-muted">{maskKey(savedKey)}</code>
              </span>
              <button onClick={handleClear} className="text-xs text-accent underline underline-offset-4">
                移除
              </button>
            </>
          ) : (
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2 rounded-full bg-accent" />
              尚未設定
            </span>
          )}
        </div>

        <label className="mt-6 mb-2 block text-sm font-medium" htmlFor="api-key-input">
          {savedKey ? "更換 API Key" : "輸入 API Key"}
        </label>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center rounded-2xl border border-line bg-paper pr-2 focus-within:border-ink">
            <input
              id="api-key-input"
              ref={inputRef}
              type={reveal ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-..."
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setSaved(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="shrink-0 px-2 text-xs text-muted hover:text-ink"
            >
              {reveal ? "隱藏" : "顯示"}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!looksValid}
            className="shrink-0 rounded-2xl bg-accent px-5 text-sm font-medium text-accent-ink transition-opacity disabled:opacity-40"
          >
            儲存
          </button>
        </div>
        {trimmed && !looksValid && <p className="mt-2 text-xs text-accent">API Key 應以 sk- 開頭</p>}
        {saved && <p className="mt-2 text-xs text-good">✓ 已儲存，可以開始面試了</p>}

        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-xs text-muted underline underline-offset-4 hover:text-ink"
        >
          還沒有 Key？到 OpenAI 後台建立 ↗
        </a>

        <div className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          🔒 Key 只儲存在這個瀏覽器的 localStorage。每次面試請求時會傳給我們的伺服器轉送給 OpenAI，伺服器不會保存。在共用電腦上使用後，記得按「移除」。
        </div>
      </div>
    </div>
  );
}
