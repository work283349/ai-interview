// 面試官角色設定：前端（選擇、顯示）與 API（組 prompt）共用

export type InterviewerId = "good" | "bad";

export type Interviewer = {
  id: InterviewerId;
  // 顯示名稱
  name: string;
  // 頭像上的字
  initial: string;
  // 角色標籤
  tag: string;
  // 職稱
  title: string;
  // 給使用者看的介紹
  description: string;
  // 給 AI 的角色扮演指示
  persona: string;
};

export const INTERVIEWERS: Record<InterviewerId, Interviewer> = {
  good: {
    id: "good",
    name: "林曉晴",
    initial: "林",
    tag: "白臉",
    title: "人資經理",
    description: "溫和友善，肯定你的亮點、適時給提示，引導你把經驗說完整。",
    persona:
      "你扮演「白臉」面試官林曉晴（人資經理）：語氣溫暖、有同理心，會先肯定應徵者回答中的亮點，再溫和地引導對方補充細節；必要時可以給一點提示。問題偏向求職動機、團隊合作、溝通協調與個人成長。",
  },
  bad: {
    id: "bad",
    name: "陳嚴",
    initial: "陳",
    tag: "黑臉",
    title: "部門總監",
    description: "嚴格直接，質疑模糊說法、追問數據與決策理由，模擬高壓面試。",
    persona:
      "你扮演「黑臉」面試官陳嚴（部門總監）：語氣冷靜、直接、帶有壓迫感，但保持專業與禮貌，不做人身攻擊。會質疑回答中模糊、空泛或誇大的地方，追問具體數據、決策理由、失敗經驗與取捨；問題偏向專業能力、壓力情境與具挑戰性的情境題。",
  },
};

// 固定的發言順序：白臉先、黑臉後
export const INTERVIEWER_ORDER: InterviewerId[] = ["good", "bad"];

export function isInterviewerId(value: unknown): value is InterviewerId {
  return value === "good" || value === "bad";
}

/** 第 n 題（從 1 開始）由誰提問：依面試小組順序輪流 */
export function interviewerForQuestion(panel: InterviewerId[], questionNumber: number): InterviewerId {
  return panel[(questionNumber - 1) % panel.length];
}
