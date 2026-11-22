// 定義對話訊息的型別：role 是說話的人（面試官或應徵者），content 是內容
type ChatMessage = {
  // assistant 代表面試官（AI），user 代表應徵者（使用者）
  role: "assistant" | "user";
  // 訊息的文字內容
  content: string;
}; // ChatMessage 型別結束

// 定義前端送進來的請求內容型別
type InterviewRequest = {
  // 使用者輸入的職缺描述
  jobDescription: string;
  // 到目前為止的面試對話紀錄
  messages: ChatMessage[];
  // 使用者選擇的面試題數
  totalQuestions: number;
}; // InterviewRequest 型別結束

// 題數的最小值
const MIN_QUESTIONS = 1;
// 題數的最大值，避免對話過長、花費太多
const MAX_QUESTIONS = 10;

// 從環境變數讀取要使用的 OpenAI 模型，沒設定就用預設值
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// 處理 POST /api/interview 請求的函式
export async function POST(request: Request) {
  // 從環境變數（.env.local）讀取 OpenAI 的 API 金鑰
  const apiKey = process.env.OPENAI_API_KEY;
  // 如果沒有設定金鑰
  if (!apiKey) {
    // 回傳 500 錯誤，提醒伺服器設定有問題
    return Response.json({ error: "伺服器尚未設定 OPENAI_API_KEY" }, { status: 500 });
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

  // 計算使用者已經回答了幾題（user 訊息的數量）
  const answeredCount = messages.filter((m) => m.role === "user").length;
  // 判斷是否已經回答完所有題目，是的話就進入評分階段
  const isFinished = answeredCount >= totalQuestions;

  // 根據目前階段，組出要給 AI 的系統指示（system prompt）
  const systemPrompt = isFinished
    ? // 面試結束：要求 AI 依照整段對話給出評分與建議，並以 JSON 格式回覆
      `你是一位專業且嚴謹的面試官。以下是職缺描述：
"""
${jobDescription}
"""
面試已經結束，共 ${totalQuestions} 題，請根據應徵者在整場面試中的回答進行評估。
除了整體評分，也要針對每一題（依照提問順序）給出點評，並示範一個更好的回答方式。
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
  ]
}
questionFeedback 陣列的長度必須剛好是 ${totalQuestions}，順序與提問順序相同。
請使用繁體中文。`
    : // 面試進行中：要求 AI 出下一題，可以針對上一題追問或換新題目
      `你是一位專業且友善的面試官，正在針對以下職缺進行面試：
"""
${jobDescription}
"""
整場面試共 ${totalQuestions} 題，目前要問第 ${answeredCount + 1} 題。
${answeredCount === 0 ? "請先簡短打招呼，然後提出第一個問題。" : "請先對應徵者上一題的回答做一句簡短回饋，然後可以針對回答內容追問，或提出新的問題。"}
一次只問一個問題，問題要和職缺相關。
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
          // 把前端傳來的對話紀錄只保留 role 和 content 後展開放入
          ...messages.map((m) => ({ role: m.role, content: String(m.content) })),
        ], // 訊息陣列結束
      }), // 請求內容結束
    }); // fetch 結束

    // 如果 OpenAI 回應的狀態碼不是成功
    if (!openaiRes.ok) {
      // 讀取錯誤訊息文字
      const errText = await openaiRes.text();
      // 在伺服器端印出錯誤，方便除錯
      console.error("OpenAI API 錯誤：", errText);
      // 回傳 502 錯誤給前端
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
      // 從對話紀錄中依序取出面試官的每一題
      const questions = messages.filter((m) => m.role === "assistant").map((m) => m.content);
      // 從對話紀錄中依序取出使用者的每一個回答
      const answers = messages.filter((m) => m.role === "user").map((m) => m.content);
      // 取出 AI 給的每題點評，若不是陣列就給空陣列
      const aiFeedback = Array.isArray(parsed.questionFeedback) ? parsed.questionFeedback : [];
      // 把題目、使用者回答、AI 點評與較佳回答，依照題號組合在一起
      const questionFeedback = questions.slice(0, totalQuestions).map((question, i) => ({
        // 面試官的題目
        question,
        // 使用者當時的回答
        answer: answers[i] ?? "",
        // AI 對這一題的點評
        feedback: aiFeedback[i]?.feedback ?? "",
        // AI 示範的較佳回答
        betterAnswer: aiFeedback[i]?.betterAnswer ?? "",
      })); // 每題組合結束
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
      }); // 評分回傳結束
    } // 面試結束判斷結束

    // 面試還在進行中，回傳下一題給前端
    return Response.json({
      // 告訴前端這是題目
      type: "question",
      // 題目內容
      question: parsed.question ?? "",
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
