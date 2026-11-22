// 匯入面試官角色設定、發言順序、型別檢查與輪流提問的工具函式
import { INTERVIEWERS, INTERVIEWER_ORDER, interviewerForQuestion, isInterviewerId, type InterviewerId } from "@/lib/interviewers";

// 定義對話訊息的型別：role 是說話的人（面試官或應徵者），content 是內容
type ChatMessage = {
  // assistant 代表面試官（AI），user 代表應徵者（使用者）
  role: "assistant" | "user";
  // 訊息的文字內容
  content: string;
  // 這則訊息是哪一位面試官說的（只有面試官的訊息才有）
  interviewer?: InterviewerId;
}; // ChatMessage 型別結束

// 定義前端送進來的請求內容型別
type InterviewRequest = {
  // 使用者輸入的職缺描述
  jobDescription: string;
  // 到目前為止的面試對話紀錄
  messages: ChatMessage[];
  // 使用者選擇的面試題數
  totalQuestions: number;
  // 使用者選擇的面試官（白臉、黑臉，可單選或兩位都選）
  interviewers: InterviewerId[];
}; // InterviewRequest 型別結束

// 題數的最小值
const MIN_QUESTIONS = 1;
// 題數的最大值，避免對話過長、花費太多
const MAX_QUESTIONS = 10;

// 從環境變數讀取要使用的 OpenAI 模型，沒設定就用預設值
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// 前端帶上使用者 API 金鑰時使用的標頭名稱（需與 src/lib/apiKey.ts 一致）
const API_KEY_HEADER = "x-openai-api-key";

// 處理 POST /api/interview 請求的函式
export async function POST(request: Request) {
  // BYOK：從請求標頭讀取使用者自己的 OpenAI API 金鑰（不使用伺服器環境變數），並去掉前後空白
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim() ?? "";
  // 如果使用者沒有帶上金鑰
  if (!apiKey) {
    // 回傳 401 錯誤，提醒使用者先到設定輸入 API Key
    return Response.json({ error: "請先在設定中輸入你的 OpenAI API Key", code: "missing_api_key" }, { status: 401 });
  } // 金鑰檢查結束

  // 宣告變數用來存放解析後的請求內容
  let body: InterviewRequest;
  // 嘗試解析請求的 JSON
  try {
    // 把請求本文轉成 JSON 物件
    body = await request.json();
  } catch {
    // 如果 JSON 格式錯誤，回傳 400 錯誤
    return Response.json({ error: "請求格式錯誤" }, { status: 400 });
  } // JSON 解析結束

  // 取出職缺描述並去掉前後空白，若不存在則為空字串
  const jobDescription = body.jobDescription?.trim() ?? "";
  // 取出對話紀錄，若不是陣列就當作空陣列
  const messages = Array.isArray(body.messages) ? body.messages : [];
  // 把使用者選擇的題數轉成整數
  const totalQuestions = Math.floor(Number(body.totalQuestions));
  // 取出使用者選擇的面試官，若不是陣列就當作空陣列
  const requestedPanel: unknown[] = Array.isArray(body.interviewers) ? body.interviewers : [];
  // 依固定順序（白臉先、黑臉後）只保留合法且有被選擇的面試官，同時去除重複
  const panel = INTERVIEWER_ORDER.filter((id) => requestedPanel.includes(id));

  // 如果沒有填寫職缺描述
  if (!jobDescription) {
    // 回傳 400 錯誤，請使用者先輸入職缺描述
    return Response.json({ error: "請輸入職缺描述" }, { status: 400 });
  } // 職缺描述檢查結束

  // 如果題數不是數字，或超出允許範圍
  if (!Number.isInteger(totalQuestions) || totalQuestions < MIN_QUESTIONS || totalQuestions > MAX_QUESTIONS) {
    // 回傳 400 錯誤，告訴使用者題數的合法範圍
    return Response.json({ error: `題數必須介於 ${MIN_QUESTIONS} 到 ${MAX_QUESTIONS} 題之間` }, { status: 400 });
  } // 題數檢查結束

  // 如果一位面試官都沒有選
  if (panel.length === 0) {
    // 回傳 400 錯誤，請使用者至少選擇一位面試官
    return Response.json({ error: "請至少選擇一位面試官" }, { status: 400 });
  } // 面試官檢查結束

  // 計算使用者已經回答了幾題（user 訊息的數量）
  const answeredCount = messages.filter((m) => m.role === "user").length;
  // 判斷是否已經回答完所有題目，是的話就進入評分階段
  const isFinished = answeredCount >= totalQuestions;
  // 判斷是不是多位面試官的小組面試
  const isPanel = panel.length > 1;
  // 把面試小組每位成員整理成一行介紹文字，放進 prompt 讓 AI 知道有哪些人
  const panelIntro = panel.map((id) => `- ${INTERVIEWERS[id].name}（${INTERVIEWERS[id].tag}，${INTERVIEWERS[id].title}）`).join("\n");
  // 計算下一題由哪位面試官提問（依小組順序輪流）
  const currentId = interviewerForQuestion(panel, answeredCount + 1);
  // 取得下一題提問面試官的完整設定
  const current = INTERVIEWERS[currentId];

  // 根據目前階段，組出要給 AI 的系統指示（system prompt）
  const systemPrompt = isFinished
    ? // 面試結束：要求 AI 依照整段對話給出評分、建議，以及每位面試官各自的結語
      `你是這場面試的評審小組。以下是職缺描述：
"""
${jobDescription}
"""
面試小組成員：
${panelIntro}
面試已經結束，共 ${totalQuestions} 題，請根據應徵者在整場面試中的回答進行客觀評估。
除了整體評分，也要針對每一題（依照提問順序）給出點評，並示範一個更好的回答方式。
另外，請讓每位面試官以自己的角色口吻，各給應徵者一段 1~2 句的結語。
請只回覆 JSON，格式如下：
{
  "score": 0 到 100 的整數分數,
  "summary": "整體表現總結（2~3 句）",
  "strengths": ["優點1", "優點2"],
  "improvements": ["改進建議1", "改進建議2"],
  "questionFeedback": [
    {
      "feedback": "這一題回答的優缺點點評",
      "betterAnswer": "以應徵者第一人稱示範的較佳回答"
    }
  ],
  "panelComments": [
    { "interviewer": "面試官代號（${panel.join(" 或 ")}）", "comment": "該面試官的結語" }
  ]
}
questionFeedback 陣列的長度必須剛好是 ${totalQuestions}，順序與提問順序相同。
panelComments 要包含以下每位面試官各一則：${panel.map((id) => `${id}=${INTERVIEWERS[id].name}`).join("、")}。
對話紀錄中面試官的發言開頭會以【名字】標示是誰說的。
請使用繁體中文。`
    : // 面試進行中：要求目前輪到的面試官以自己的角色風格出下一題
      `你正在扮演一場${isPanel ? "由多位面試官輪流提問的小組面試" : "一對一面試"}中的面試官，職缺描述如下：
"""
${jobDescription}
"""
面試小組成員：
${panelIntro}
整場面試共 ${totalQuestions} 題，目前要問第 ${answeredCount + 1} 題，這一題輪到「${current.name}」發言。
${current.persona}
${
  answeredCount === 0
    ? isPanel
      ? `請以${current.name}的身分，先代表面試小組簡短打招呼並介紹在場的面試官，然後提出第一個問題。`
      : "請先簡短自我介紹並打招呼，然後提出第一個問題。"
    : "請先以你的角色風格，對應徵者上一題的回答做一句簡短回應，然後可以針對回答內容追問，或提出新的問題。"
}
一次只問一個問題，問題要和職缺相關，並且要符合你的角色個性。
對話紀錄中面試官的發言開頭會以【名字】標示是誰說的；你的回覆不要加上這個標示。
請只回覆 JSON，格式如下：
{ "question": "你要說的話與問題" }
請使用繁體中文。`; // 系統指示組合結束

  // 嘗試呼叫 OpenAI API
  try {
    // 用 fetch 發送請求到 OpenAI 的 Chat Completions API
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      // 使用 POST 方法
      method: "POST",
      // 設定請求標頭
      headers: {
        // 告訴 OpenAI 送出的內容是 JSON
        "Content-Type": "application/json",
        // 帶上 API 金鑰做身分驗證
        Authorization: `Bearer ${apiKey}`,
      }, // 標頭設定結束
      // 把請求內容轉成 JSON 字串
      body: JSON.stringify({
        // 指定使用的模型
        model: MODEL,
        // 要求 AI 一定要回傳 JSON 格式
        response_format: { type: "json_object" },
        // 組合訊息：先放系統指示，再放完整對話紀錄
        messages: [
          // 系統指示放在第一則
          { role: "system", content: systemPrompt },
          // 把對話紀錄只保留 role 和 content，面試官的發言前面加上【名字】讓 AI 分辨是誰說的
          ...messages.map((m) => ({
            // 保留原本的角色（assistant 或 user）
            role: m.role,
            // 如果是面試官且有合法的面試官代號，就在內容前加上【名字】，否則直接使用原內容
            content:
              m.role === "assistant" && isInterviewerId(m.interviewer)
                ? `【${INTERVIEWERS[m.interviewer].name}】${String(m.content)}`
                : String(m.content),
          })), // 對話紀錄轉換結束
        ], // 訊息陣列結束
      }), // 請求內容結束
    }); // fetch 結束

    // 如果 OpenAI 回應的狀態碼不是成功
    if (!openaiRes.ok) {
      // 讀取錯誤訊息文字
      const errText = await openaiRes.text();
      // 在伺服器端印出錯誤，方便除錯（不印出金鑰）
      console.error("OpenAI API 錯誤：", errText);
      // 如果 OpenAI 回應 401，代表使用者的金鑰無效或已被撤銷
      if (openaiRes.status === 401) {
        // 回傳 401 錯誤，請使用者檢查金鑰
        return Response.json({ error: "API Key 無效，請到設定確認後重新輸入", code: "invalid_api_key" }, { status: 401 });
      } // 金鑰無效判斷結束
      // 如果 OpenAI 回應 429，代表額度用完或請求過於頻繁
      if (openaiRes.status === 429) {
        // 回傳 429 錯誤，請使用者檢查 OpenAI 帳戶額度
        return Response.json({ error: "OpenAI 額度不足或請求過於頻繁，請確認你的帳戶餘額", code: "rate_limited" }, { status: 429 });
      } // 額度判斷結束
      // 其他錯誤一律回傳 502 錯誤給前端
      return Response.json({ error: "AI 服務暫時無法使用" }, { status: 502 });
    } // 狀態碼檢查結束

    // 把 OpenAI 的回應轉成 JSON 物件
    const data = await openaiRes.json();
    // 取出 AI 回覆的文字內容
    const content: string = data.choices?.[0]?.message?.content ?? "{}";
    // 把 AI 回覆的 JSON 字串解析成物件
    const parsed = JSON.parse(content);

    // 如果面試已經結束
    if (isFinished) {
      // 從對話紀錄中依序取出面試官的每一則發言（包含題目與提問者）
      const askedMessages = messages.filter((m) => m.role === "assistant");
      // 從對話紀錄中依序取出使用者的每一個回答
      const answers = messages.filter((m) => m.role === "user").map((m) => m.content);
      // 取出 AI 給的每題點評，若不是陣列就給空陣列
      const aiFeedback = Array.isArray(parsed.questionFeedback) ? parsed.questionFeedback : [];
      // 把題目、提問者、使用者回答、AI 點評與較佳回答，依照題號組合在一起
      const questionFeedback = askedMessages.slice(0, totalQuestions).map((m, i) => ({
        // 面試官的題目
        question: m.content,
        // 這一題是哪位面試官問的，若紀錄裡沒有就依輪流規則推算
        interviewer: isInterviewerId(m.interviewer) ? m.interviewer : interviewerForQuestion(panel, i + 1),
        // 使用者當時的回答
        answer: answers[i] ?? "",
        // AI 對這一題的點評
        feedback: aiFeedback[i]?.feedback ?? "",
        // AI 示範的較佳回答
        betterAnswer: aiFeedback[i]?.betterAnswer ?? "",
      })); // 每題組合結束
      // 取出 AI 給的面試官結語，若不是陣列就給空陣列
      const aiPanelComments: { interviewer?: unknown; comment?: unknown }[] = Array.isArray(parsed.panelComments)
        ? parsed.panelComments
        : [];
      // 依面試小組順序，替每位面試官找出對應的結語，找不到就給空字串
      const panelComments = panel.map((id) => ({
        // 面試官代號
        interviewer: id,
        // 該面試官的結語內容
        comment: String(aiPanelComments.find((c) => c?.interviewer === id)?.comment ?? ""),
      })); // 結語組合結束
      // 回傳評分結果給前端，type 標示為 evaluation
      return Response.json({
        // 告訴前端這是評分結果
        type: "evaluation",
        // 分數，轉成數字以防 AI 回傳字串
        score: Number(parsed.score) || 0,
        // 整體總結
        summary: parsed.summary ?? "",
        // 優點清單，若不是陣列就給空陣列
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        // 改進建議清單，若不是陣列就給空陣列
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        // 每一題的點評與較佳回答
        questionFeedback,
        // 每位面試官的結語，只保留有內容的
        panelComments: panelComments.filter((c) => c.comment),
      }); // 評分回傳結束
    } // 面試結束判斷結束

    // 面試還在進行中，回傳下一題給前端
    return Response.json({
      // 告訴前端這是題目
      type: "question",
      // 題目內容
      question: parsed.question ?? "",
      // 這一題由哪位面試官提問
      interviewer: currentId,
      // 目前是第幾題
      questionNumber: answeredCount + 1,
      // 總共幾題
      totalQuestions,
    }); // 題目回傳結束
  } catch (error) {
    // 在伺服器端印出非預期的錯誤
    console.error("面試 API 發生錯誤：", error);
    // 回傳 500 錯誤給前端
    return Response.json({ error: "伺服器發生錯誤，請稍後再試" }, { status: 500 });
  } // try/catch 結束
} // POST 函式結束
