import { NextRequest } from 'next/server';
import { ARENA_LEVELS } from '../../../lib/data';
import { ChatMessage } from '../../../types';

export const runtime = 'edge';

// 硅基流动 (SiliconFlow) API 配置
const API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const MODEL_NAME = process.env.MODEL_NAME || "deepseek-ai/DeepSeek-V3.1-Terminus";

export async function POST(req: NextRequest) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });
  }

  try {
    const { type, inputData } = await req.json();
    let messages: any[] = [];
    
    // --- 1. 构建 Prompt (提示词) ---
    // 所有的核心 Prompt 逻辑都在这里，前端无法查看，绝对安全。

    if (type === 'online') {
      const systemPrompt = `你是一位深谙中国式人情世故的“社交师爷”。
你的任务是模拟微信聊天回复。

**核心要求：**
1. **中国式人情世故**：你不仅懂字面意思，更懂潜台词、面子文化、利益拉扯。你的回复要做到“滴水不漏”或“八面玲珑”。
2. **回复风格**：根据语境，**随机生成 1 到 3 句**回复。不要每次都死板地生成两句。模拟真实的打字节奏，有时简洁（1句），有时着急（3句连发）。
3. **内容深度**：Plan A/B/C 的回复必须高情商。
4. **心法批注**：心法部分必须是“降维打击”般的点拨，一针见血地指出人性弱点或底层逻辑（例如：此话看似示弱，实则以退为进）。

**输出格式（纯文本，不要JSON）：**
===PLAN_START===
【标题】Plan A: [四字流派]
【心法】[深刻的心理博弈分析]
【回复】[第一条气泡]
【回复】[第二条气泡 (可选)]
【回复】[第三条气泡 (可选)]
===PLAN_END===

...以此类推 Plan B, Plan C。`;

      const userContent = `对方身份：${inputData.role}\n意图：${inputData.intent}\n关系分(0-10)：${inputData.score}\n对方原话：${inputData.text}`;
      
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ];
      
    } else if (type === 'offline') {
      const roleInfo = inputData.formState?.role ? `我的角色/处境：${inputData.formState.role}` : '';
      const whoInfo = inputData.formState?.who ? `关键人物/对象：${inputData.formState.who}` : '';
      const intentInfo = inputData.formState?.intent ? `我的核心意图/诉求：${inputData.formState.intent}` : '';

      const systemPrompt = `你是一位久经沙场的社交“老炮儿”。
请根据场景、局势和目标，生成 2 个行动锦囊。

**场景**：${inputData.scenario}
${roleInfo}
${whoInfo}
${intentInfo}
**补充说明**：${inputData.supplement || '无'}

**核心要求**：
1. **傻瓜式拆解**：不要讲大道理！请把策略拆解为 3~6 个具体的执行步骤。
2. **话术强制**：凡是涉及沟通的步骤，必须写出**具体要说什么**（话术），不要只写“去沟通”或“去敬酒”。直接给能照着念的词！
3. **心法深邃**：心法部分要写透局势（当前是什么局？雷区在哪？如何照顾面子？），字数在 50-100 字左右。使用 markdown 加粗 (**关键词**) 来强调重点。
4. **动态步骤**：不要死板地使用“观察”、“敬酒”等固定标签。根据实际情况，可以是 [🎁]备礼、[🚪]撤退、[📱]发消息、[🎭]演技 等。
5. **Emoji使用**：每个步骤必须配一个合适的 Emoji 图标。

**严格输出格式 (不要输出任何Markdown代码块，直接按以下格式)：**

===PLAN_START===
【标题】Plan A: [3-5字流派名]
【心法】[这里写局势分析、注意事项、心理建设，要有头有尾。使用 **加粗** 强调关键词]
【步骤】[👀] 关键词 - [具体动作 + 具体话术。使用 **加粗** 强调关键词。例如：眼神看向领导，举杯说：“张总，借这个机会...”]
【步骤】[emoji] 关键词 - [具体内容...]
===PLAN_END===

===PLAN_START===
【标题】Plan B: [3-5字流派名]
...
===PLAN_END===`;
      
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成应对方案。" }
      ];

    } else if (type === 'arena') {
      const levelId = inputData.levelInfo?.id || 1;
      const levelInfo = ARENA_LEVELS.find(l => l.id === levelId) || ARENA_LEVELS[0];
      const history = inputData.history as ChatMessage[];
      const lastMood = inputData.currentMood || levelInfo.initialMood;

      const systemPrompt = `【微信聊天模拟指令】
你正在扮演：${levelInfo.opponentName}。
你的性格设定：${levelInfo.background}
你的初始心情值：${lastMood} (范围0-100)。

**绝对禁令：**
1. **严禁描写任何物理动作！** (如：禁止输出 "（叹气）"、"（握手）")，这是纯微信聊天。
2. **严禁替用户回复！** 只能输出你自己的话。
3. **分句强制**：必须使用 "|||" 将回复分为 1-3 句。

**【心情数值机制】（残酷模式）：**
1. **升分极慢**：用户的回复如果得体，心情值**只能增加 1~2 分**（极其吝啬）。
2. **降分极快**：如果用户冒犯、敷衍或直接拒绝，心情值**直接扣除 20~30 分**（像坐过山车）。
3. **瞬间崩盘**：如果用户言语恶劣，触碰底线，直接将心情值设为 0。

**【胜负裁决逻辑】：**
本关玩家(用户)的胜利条件是：【${levelInfo.victoryCondition}】

**判定规则：**
1. **失败 (LOSE)**：
   - 如果用户**妥协了**（例如：同意付钱、发了红包、同意背锅），哪怕你很高兴，**用户也判输**！(理由：破财/受气)。
   - 如果你的 Mood < 10，谈判破裂，用户判输。
2. **胜利 (WIN)**：
   - 只有当用户**成功达成胜利条件**（例如：让你放弃了要钱/甩锅），且你的 Mood > 0 时，才判赢。

【输出格式 - 必须严格遵守】
**先输出数据，后输出回复！**
**回复节奏（【最高优先级】强制执行）：**
回复内容必须使用 "|||" 符号作为气泡分隔符，分成 1-3 句。

格式如下：
###DATA###
{
  "mood": [新数值],
  "innerOS": "[你此刻的真实心理活动，要毒舌一点]",
  "isGameOver": [true/false],
  "isWin": [true/false],
  "score": [0-100],
  "analysis": "[简短分析]"
}
###TEXT###
[你的回复气泡1]|||[气泡2]|||[气泡3]
`;
      
      // 构建历史消息 Context
      messages.push({ role: "system", content: systemPrompt });

      // 过滤掉 system 类型的消息，将 ai 映射为 assistant
      const rawHistory = history.filter(m => m.sender !== 'system');
      
      // DeepSeek 同样遵循 User -> Assistant -> User 的对话流
      for (const msg of rawHistory) {
         if (msg.sender === 'ai') {
             messages.push({ role: "assistant", content: msg.text });
         } else if (msg.sender === 'user') {
             messages.push({ role: "user", content: msg.text });
         }
      }

      // 加上当前的最新一条用户消息（带心情提示）
      messages.push({ 
          role: "user", 
          content: `(当前你的心情值: ${lastMood}) 用户回复: ${inputData.text}` 
      });
    }

    // --- 2. 调用 SiliconFlow API ---
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        stream: true, // 开启流式输出
        temperature: 1.3, // 稍微高一点的温度，让回答更灵活、更有“人味”
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("SiliconFlow API Error:", errorText);
        return new Response(JSON.stringify({ error: `API Error: ${response.status}` }), { status: 500 });
    }

    // --- 3. 处理 SSE 流 (Server-Sent Events) ---
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
            controller.close();
            return;
        };
        const reader = response.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // 保留最后一行可能不完整的

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;
              
              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.substring(6); // 去掉 "data: "
                  const data = JSON.parse(jsonStr);
                  const content = data.choices?.[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream parsing error", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}