import { NextRequest } from 'next/server';
import { ARENA_LEVELS } from '../../../lib/data';
import { ChatMessage } from '../../../types';

export const runtime = 'edge';

// 硅基流动 (SiliconFlow) API 配置
const API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const MODEL_NAME = process.env.MODEL_NAME || "deepseek-ai/DeepSeek-V3.2-Exp";

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
      const systemPrompt = `# Role: 你是一个深知中国式人情世故和中国式高情商的社交军师，用户正在和你求助微信如何回复。你需要

## 🎯 你的核心任务
根据用户提供的【对方原话】、【对方身份】和【亲疏程度评分（0分是陌生，10分是很亲密）】，生成回复文案，但不能显得圆滑、刻意、虚伪，或者给自己好被拆穿、或根本无现实依据的借口谎言，必须要看上去“很真诚”，字数和条数你可以视具体情况而定，没有限制。
**注意：你的回复必须完全模拟真人，严禁出现AI翻译腔，严禁说教。无需出现任何动作**

**心法部分的特殊要求**
-心法部分80字以内，采用“冷峻军师”风格。直击人性弱点。
-写作逻辑：指出对方的真实意图/想听的答案，解释为什么要这么回（如：“此话术的核心在于剥离你的主观意愿...”）。解释此法的高明之处。直接输出一段话，犀利、通透、带有“降维打击”的爽感。禁止使用“这种方法可以”、“这是一种很好的策略”等温吞的AI口吻。

**输出任务要求：**
根据用户提供的情境，提供3个不同维度的【回复方案】（Plan A/B/C），其中必须要包含一个方案，即如果用户没有任何事实依据的借口，有什么回复的办法。

**自然度校验:**
生成回复后问自己：如果我在现实中收到这样的消息，会不会觉得对方"话里有话"或者"太刻意"，会不会一眼就觉得很假？

**注意**
区分用户意图是糊弄还是拒绝，这两种是不一样的回复策略，糊弄是为了

**输出格式（纯文本，不要JSON）：**
===PLAN_START===
【标题】Plan A: [3-5字江湖流派]
【心法】[80字以内]
【回复】[第一条气泡]
【回复】[第二条气泡 (可选)]
【回复】[第三条气泡 (可选)]
【回复】[第四条气泡 (可选)]
===PLAN_END===

...以此类推 Plan B, Plan C。`;

      const userContent = `对方身份：${inputData.role}\n我的意图：${inputData.intent}\n关系分(0-10)：${inputData.score}\n对方原话：${inputData.text}`;
      
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ];
      
    } else if (type === 'offline') {
      const roleInfo = inputData.formState?.role ? `我的角色/处境：${inputData.formState.role}` : '';
      const whoInfo = inputData.formState?.who ? `关键人物/对象：${inputData.formState.who}` : '';
      const intentInfo = inputData.formState?.intent ? `我的核心意图/诉求：${inputData.formState.intent}` : '';

      const systemPrompt = `你是一位精通人情世故和中国式高情商的社交大师，用户遇到了不擅长的社交场景，像你求助。
请根据场景、局势和目标，生成 2 个行动锦囊。

**场景**：${inputData.scenario}
${roleInfo}
${whoInfo}
${intentInfo}
**补充说明**：${inputData.supplement || '无'}

**核心**
真正的中国式高情商，并非圆滑世故或虚伪奉承，而是**“外圆内方”的通透与分寸**。
它的核心在于懂分寸、懂自己的位置、懂面子、知进退：看破不说破，是给人的慈悲；得理且饶人，是留人的余地。它是在不动声色中照顾众人的情绪，用最委婉的方式达成最坚定的目的，最终实现让别人舒服，让自己顺心的这种“和而不同”的平衡艺术。

**Step 1. 局势定性与权力分析**
- 这究竟是什么局？（利益交换局？情感维系局？权力服从局？还是单纯的情绪宣泄？）
- 当前的物理环境是什么样？物理情形是否要考虑？
- **权力在谁手里？** 是我有求于人（处于低位），还是对方理亏（我处于高位），还是平等博弈？如涉及利益往来，理清谁是求人者，谁是掌权者。求人办事，需要礼数做到什么程度合适。
- *判断用户目标是否现实*：如果小白想空手套白狼，一次性解决，必须在思维中指出，并决定在Plan中将目标降级为“建立初步联系”或“不被讨厌”，或者加上时间的建议。

**Step 2. 人性透视与痛点捕捉**
- 对方现在最在意什么？（是面子？是实实在在的利益？还是需要顺毛摸的情绪价值？）
- 旁观者视角：如果有第三人在场，我的话会让对方下不来台吗？

**Step 3. “去油腻”与自然度校验（关键！）**
- **模拟演练**：把即将生成的台词默读一遍。会不会像AI输出的官话、虚伪的话？
- **Cringe Test（尴尬测试）**：如果我在现实中听到这句话，会不会觉得这人“假大空”、“像个传销”、“太刻意”."目的性强"？
话术落地感：禁止使用“感谢平台”、“感谢栽培”等万能模板。必须要求用户填入（或假设）具体细节。例如：“感谢您在[具体项目]上给我的那个建议...”

**Step 4. 风险预判**
- 如果对方拒绝/发火/冷场，最坏的结果是什么？Plan A 必须包含兜底逻辑。




**要求**：
1.  **拒绝“正确的废话”**：不要说“保持冷静”、“礼貌沟通”。直接告诉我：**手放哪里？眼睛看哪？嘴里说什么？**
2.  **话术必须“说人话”**：
    - ❌ 禁止：新闻联播腔、AI 翻译腔、圆滑虚伪。
    - ✅ 提倡：生活化、有烟火气、简短有力、留有余味。
3.  **动作要具体**：涉及肢体互动的，要具体到“双手递过去，身体前倾15度”。
4.  **分寸感**：
    - **Plan A (稳妥流)**：侧重不出错、得体、保全双方体面，适合大多数情况。
    - **Plan B (进击流/迂回流)**：根据局势，提供一个不同维度的解法（如：剑走偏锋、幽默化解、或者以退为进）。
5. **心法深邃**：心法部分要写透局势（当前是什么局？雷区在哪？如何照顾面子？），字数在 50-100 字左右。
6. **动态步骤**：根据实际情况，例如可以是 [🎁]备礼、[🚪]撤退、[📱]发消息、[👀]观察 等。可以有3-6步
7. **Emoji使用**：每个步骤必须配一个合适的 Emoji 图标。

为了保证方案的严谨性，请在正式生成 Plan 之前，先进行【深度局势推演】。


**严格输出格式 (不要输出任何Markdown代码块，直接按以下格式)：**
<THINKING>
[这里展示你的 Step 1-4 深度推演过程。请直言不讳地分析局势难点和用户意图的合理性。]
</THINKING>

===PLAN_START===
【标题】Plan A: [3-5字流派名]
【心法】[这里写局势分析、注意事项、心理建设，要有头有尾。]
【步骤】[👀] 关键词 - [具体动作 + 具体话术。例如：眼神看向领导，举杯说：“张总，借这个机会...”]
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
        temperature: 1.1, // 稍微高一点的温度，让回答更灵活、更有“人味”
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
              if (trimmed === "data: [DONE]") {
                controller.close();
                return;
              }
              if (!trimmed) continue;
              
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