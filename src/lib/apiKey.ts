"use client";

import { useSyncExternalStore } from "react";

// 存放在 localStorage 的鍵名
const STORAGE_KEY = "rehearse:openai-api-key";
// 同一分頁內通知其他元件 Key 已變更
const CHANGE_EVENT = "rehearse:api-key-change";
// 通知設定視窗打開
const OPEN_EVENT = "rehearse:open-settings";

// 送到我們 API 時使用的 header 名稱（需與 route.ts 一致）
export const API_KEY_HEADER = "x-openai-api-key";

export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setApiKey(key: string) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 無法寫入（例如無痕模式封鎖儲存空間）時忽略
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/** 讀取目前儲存的 API Key，變更時會自動重新渲染 */
export function useApiKey(): string {
  return useSyncExternalStore(subscribe, getApiKey, () => "");
}

/** 只顯示前後幾碼，例如 sk-proj…a1B2 */
export function maskKey(key: string) {
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function openSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenSettings(callback: () => void) {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}
