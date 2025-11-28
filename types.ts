
// Page Navigation Types
export enum Page {
  HOME = 'HOME',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ARENA = 'ARENA'
}

// Common Types for AI Responses
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
}

export interface PlanStep {
  icon: string;
  keyword: string;
  description: string;
}

export interface Plan {
  id: string;
  title: string; // e.g., "Plan A: 太极式"
  mindset: string; // The "心法" summary
  originalText?: string; // For Online mode
  replyText?: string[]; // For Online mode (bubble content)
  steps?: PlanStep[]; // For Offline mode
}

// Arena Game Types
export interface ArenaLevel {
  id: number;
  title: string;
  opponentName: string;
  background: string;
  userContext: string; // The user's secret backstory/constraints
  openingLine: string;
  initialMood: number; // 初始好感度 (0-100)
  scenarioType: 'online' | 'offline'; // 场景类型
  victoryCondition: string; // NEW: 明确的胜利条件描述 (防止AI误判)
}

export interface ArenaTurn {
  userReply: string;
  aiResponse: string;
  isGameOver?: boolean;
  isWin?: boolean;
  score?: number;
  mood: number; // 当前心情值
  innerOS: string; // 对方的内心潜台词
  analysis?: string; // If failed, AI analyzes why
}
