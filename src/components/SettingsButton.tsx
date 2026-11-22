"use client";

import { openSettings, useApiKey } from "@/lib/apiKey";

export default function SettingsButton() {
  const key = useApiKey();
  return (
    <button
      onClick={openSettings}
      aria-label="設定 API Key"
      title={key ? "API Key 已設定" : "尚未設定 API Key"}
      className="relative grid size-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15 19 4M18 5l2 2M15 8l2 2" strokeLinecap="round" />
      </svg>
      <span
        className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-paper ${key ? "bg-good" : "bg-accent"}`}
      />
    </button>
  );
}
