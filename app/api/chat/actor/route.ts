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
      【指令】我正在和你玩一个角色扮演游戏。
      
      【我的角色设定】
      - 我的名字是: ${levelInfo.opponentName} (大刘)
      - 我的性格: ${levelInfo.background}
      - 在这场对话中，你扮演一个想向我要奶茶钱的同事。

      【规则】
      1. 我必须完全沉浸在我的角色(大刘)里进行回复。
      2. 我绝对不能替你(玩家)说出任何话。
      3. 我必须用 "|||" 将我的回复分为 1 到 3 句。
      4. 除了我的台词，我不能输出任何其他内容。
    
      【对话历史】:
      (在下面的历史记录中, 'user' 是人类玩家, 'assistant' 是你。)
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