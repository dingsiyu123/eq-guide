import { NextRequest } from 'next/server';
import { ArenaLevel, ChatMessage } from '../../../../types';

const API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const MODEL_NAME = process.env.MODEL_NAME || "deepseek-ai/DeepSeek-V3.1-Terminus";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });
  }

  try {
    const { levelInfo, history } = await req.json() as { levelInfo: ArenaLevel, history: ChatMessage[] };

    const systemPrompt = `
      【最高指令】
      你正在进行一场沉浸式角色扮演。你必须严格、完全地代入你的角色，并根据你的角色设定做出回应。

      【你的角色设定】
      - 你的名字: ${levelInfo.opponentName}
      - 你的性格和背景: ${levelInfo.background}
      - 在这场对话中，玩家的目标是: ${levelInfo.userContext}

      【对话历史】:
      (在下面的历史记录中, 'user' 代表玩家, 'assistant' 代表你。)

      【输出规则 - 铁律】
      1.  **绝对沉浸**：你的所有回复都必须完全符合你的角色设定。
      2.  **禁止越界**：绝对禁止替玩家说任何话，或扮演玩家。
      3.  **格式要求**：必须、且只能使用 "|||" 符号将你的回复分割成 1 到 3 个独立的句子（气泡）。
      4.  **内容纯净**：你只需输出回复，无需任何分析。除了你的台词和分隔符 "|||"，禁止输出任何其他内容（例如：括号、动作描述、内心想法等）。
    `;

    const messages: any[] = [{ role: "system", content: systemPrompt }];
    const rawHistory = history.filter(m => m.sender !== 'system');
    for (const msg of rawHistory) {
       if (msg.sender === 'ai') {
           messages.push({ role: "assistant", content: msg.text });
       } else if (msg.sender === 'user') {
           messages.push({ role: "user", content: msg.text });
       }
    }
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL_NAME, messages: messages, stream: true, temperature: 1.2 })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Actor API Error:", errorText);
        return new Response(JSON.stringify({ error: `API Error: ${response.status}` }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }
        const reader = response.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              
              // 遇到 [DONE] 信号，立即关闭流并退出
              if (trimmed === 'data: [DONE]') {
                controller.close();
                return;
              }
              
              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.substring(6);
                  const data = JSON.parse(jsonStr);
                  const content = data.choices?.[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) { /* 忽略解析错误 */ }
              }
            }
          }
        } catch (err) {
          console.error("Actor stream parsing error", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" }});

  } catch (error) {
    console.error("Actor Route Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}