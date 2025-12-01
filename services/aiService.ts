import { ArenaLevel, ArenaTurn, ChatMessage } from '../types';
export { ARENA_LEVELS } from '../lib/data';

/**
 * 通用的流式API调用函数
 * @param endpoint API路由地址
 * @param history 聊天历史
 * @param levelInfo 当前关卡信息
 * @param onChunk 收到数据块时的回调
 */
async function getStreamedResponse(
  endpoint: string,
  history: ChatMessage[],
  levelInfo: ArenaLevel,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, levelInfo }),
  });

  if (!response.ok) {
    throw new Error(`API request to ${endpoint} failed`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

// “演员”API的调用函数
export const getActorResponse = (
    history: ChatMessage[], 
    levelInfo: ArenaLevel, 
    onChunk: (chunk: string) => void
) => getStreamedResponse('/api/chat/actor', history, levelInfo, onChunk);

// “独白师”API的调用函数
export const getMonologueResponse = (
    history: ChatMessage[], 
    levelInfo: ArenaLevel, 
    onChunk: (chunk: string) => void
) => getStreamedResponse('/api/chat/monologue', history, levelInfo, onChunk);


/**
 * 调用“终审官”API，获取最终裁决
 */
export const getJudgeResult = async (
  history: ChatMessage[],
  levelInfo: ArenaLevel,
  lastMood: number
): Promise<ArenaTurn | null> => {
  const response = await fetch('/api/chat/judge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      history, 
      levelInfo, 
      lastMood 
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Judge API call failed:', errorData.message);
    throw new Error('评分API调用失败');
  }
  return response.json();
};
/**
 * 通用的AI响应获取函数 (用于线上嘴替 & 线下问诊)
 */
export const getAIResponse = async (
  type: 'online' | 'offline',
  inputData: any,
  onChunk: (chunk: string) => void
) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, inputData }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    onChunk(text);
  }
};