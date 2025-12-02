import { NextRequest, NextResponse } from 'next/server';
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
    const { levelInfo, history, lastMood } = await req.json() as { 
      levelInfo: ArenaLevel, 
      history: ChatMessage[], 
      lastMood: number,
    };

    const systemPrompt = `
    【指令】我正在和你玩一个角色扮演游戏，你需要根据剧本，对我(大刘)的心情和游戏结果进行最终裁决。

    【我的角色设定】
    - 我的名字是: ${levelInfo.opponentName} (大刘)
    - 我的性格: ${levelInfo.background}

    【本轮剧本】
    - 你的最新回复: "${[...history].reverse().find(m => m.sender === 'user')?.text || ''}"
    - 我上一轮的好感度: ${lastMood}

    【裁决规则】
    - 胜利条件: 【${levelInfo.victoryCondition}】
    - 失败条件: 你妥协了(比如同意请客)，或我的新好感度低于10。
    - 好感度机制: 你说话得体，我的好感度+1~2分；你说话冒犯，我的好-感度-20~30分。

    【输出格式】
    你必须只输出一个JSON对象，包含我的新好感度、游戏是否结束、你是否胜利、点评，以及一句幽默的对方最终行动。
    {
      "mood": <我的新好感度>,
      "isGameOver": <true/false>,
      "isWin": <true/false>,
      "analysis": "<你是一位深谙人情世故的社交师爷，刚刚观摩了玩家实战演练。现在，请你给出一份一阵见血的复盘。精准对玩家应对方案进行点评，无论输赢。字数控制在50-80字，风格要老道、毒舌，充满过来人的审视感。禁止直接复述游戏规则，要讲“局”，讲“人心”。>",
      "funnyReaction": "<根据游戏结果和历史对话记录，生成一句简短的幽默的对方最终行动。例如：大刘把你拉黑了/大刘四处说你坏话，你的负面消息传遍公司 / 大刘不情不愿地给你转了1块钱>"
    }
  `;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "请根据以上信息进行裁决并输出JSON。" }],
        stream: false,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Judge API Error:", errorText);
        return new Response(JSON.stringify({ error: `API Error: ${response.status}` }), { status: 500 });
    }

    const result = await response.json();
    const jsonContent = result.choices?.[0]?.message?.content;

    if (!jsonContent) {
      throw new Error("AI终审官没有返回有效的内容");
    }
    
    return NextResponse.json(JSON.parse(jsonContent));

  } catch (error: any) {
    console.error("Judge Route Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: error.message }), { status: 500 });
  }
}