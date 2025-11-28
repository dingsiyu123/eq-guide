import { ARENA_LEVELS } from '../lib/data';

// Re-export ARENA_LEVELS for UI components
export { ARENA_LEVELS };

/**
 * 客户端 API 调用
 * 请求 Next.js 后端 API (/api/chat)
 */
export const getAIResponse = async (
  type: 'online' | 'offline' | 'arena', 
  inputData: any,
  onStreamChunk?: (chunk: string) => void 
): Promise<any> => {
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        inputData
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // stream: true 选项对于处理多字节字符（如中文）非常重要，防止乱码
      const chunk = decoder.decode(value, { stream: true });
      if (onStreamChunk) {
        onStreamChunk(chunk);
      }
    }
    
  } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
  }
};