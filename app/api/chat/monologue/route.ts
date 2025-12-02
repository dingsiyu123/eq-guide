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
      【指令】我正在和你玩一个角色扮演游戏，你需要揭示出我的“内心独白”。
      【我的角色设定】
      - 我的名字是: ${levelInfo.opponentName} 
      - 我的性格: ${levelInfo.background}
      - 在这场对话中，玩家的目标是: ${levelInfo.userContext}
      【你的任务】
      1. 根据你最新说的话，生成一句完全符合我的性格和处境的、一针见血的内心想法。
      2. 你的产出只能是这句内心想法，不要加任何前缀或格式，只输出原文句子。
      3. 严禁生成你(玩家)的内心想法，只能生成我的。
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
      body: JSON.stringify({ model: MODEL_NAME, messages: messages, stream: true, temperature: 1.3 })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Monologue API Error:", errorText);
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
          console.error("Monologue stream parsing error", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });

  } catch (error) {
    console.error("Monologue Route Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}