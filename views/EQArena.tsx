import React, { useState, useEffect, useRef } from 'react';
import { ArenaTurn, ChatMessage } from '../types';
import Header from '../components/Header';
import { getActorResponse, getMonologueResponse, getJudgeResult, ARENA_LEVELS } from '../services/aiService';
import { Send, BrainCircuit, Heart, Zap, RefreshCw, User, Bot, Sparkles, Trophy, Frown, ArrowRight } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface ChatHistoryItem {
  id?: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
}

const EQArena: React.FC<Props> = ({ onBack }) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameId, setGameId] = useState(0); 
  
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [turnResult, setTurnResult] = useState<ArenaTurn | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  
  const [currentMood, setCurrentMood] = useState(50);
  const [currentOS, setCurrentOS] = useState<string>("（正在观察你的反应...）");
  const [moodChange, setMoodChange] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const currentLevel = ARENA_LEVELS[currentLevelIdx];

  useEffect(() => {
    setGameOver(false);
    setReviewMode(false);
    setTurnResult(null);
    setInputText('');
    setCurrentMood(currentLevel.initialMood);
    setCurrentOS(`（${currentLevel.opponentName}正在等待你的回复...）`);
    
    const openingParts = currentLevel.openingLine.split(/\|{1,3}/);
    setChatHistory([
      { sender: 'system', text: currentLevel.missionBrief as string },
      ...openingParts.map(t => ({ sender: 'ai', text: t } as ChatHistoryItem))
    ]);
  }, [currentLevelIdx, gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping, currentOS]);

  const handleSafeBack = () => {
    if (!gameOver && chatHistory.length > 2) {
      if (window.confirm('大侠，对局尚未结束，确定要退出江湖吗？')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || gameOver || isTyping) return;

    const userText = inputText;
    setInputText('');
    setIsTyping(true);

    const historyWithUserMessage: ChatHistoryItem[] = [...chatHistory, { sender: 'user', text: userText }];
    setChatHistory(historyWithUserMessage);
    setCurrentOS("");

    let actorFullResponse = "";
    let monologueFullResponse = "";
    
    getJudgeResult(
      historyWithUserMessage as ChatMessage[],
      currentLevel,
      currentMood
    ).then(judgeResult => {
      if (judgeResult) {
        const diff = judgeResult.mood - currentMood;
        if (diff !== 0) {
          setMoodChange(diff);
          setTimeout(() => setMoodChange(null), 2500);
        }
        setCurrentMood(judgeResult.mood);

        if (judgeResult.isGameOver) {
          setGameOver(true);
          const finalResultData: ArenaTurn = {
            userReply: userText,
            aiResponse: actorFullResponse.replace(/\|{1,3}/g, '\n'),
            isWin: judgeResult.isWin,
            score: judgeResult.mood,
            mood: judgeResult.mood,
            innerOS: monologueFullResponse,
            analysis: judgeResult.analysis,
            funnyReaction: judgeResult.funnyReaction,
          };
          setTurnResult(finalResultData);

          setTimeout(() => {
            const systemMessages: ChatHistoryItem[] = [];
            if (finalResultData.funnyReaction) {
              systemMessages.push({ sender: 'system', text: `【通知】${finalResultData.funnyReaction}` });
            }
            systemMessages.push({ sender: 'system', text: `【师爷点评】\n${finalResultData.analysis}` });
            setChatHistory(prev => [...prev, ...systemMessages]);
            setReviewMode(true);
          }, 800);
        }
      }
    }).catch(console.error);

    try {
      const actorPromise = getActorResponse(
        historyWithUserMessage as ChatMessage[],
        currentLevel,
        (chunk: string) => {
          actorFullResponse += chunk;
          const newStreamingBubbles = actorFullResponse
            .split(/\|{1,3}/)
            .filter(t => t.trim() !== '')
            .map(t => ({ sender: 'ai', text: t } as ChatHistoryItem));

          setChatHistory(prevHistory => {
            let lastUserIndex = -1;
            for (let i = prevHistory.length - 1; i >= 0; i--) {
              if (prevHistory[i].sender === 'user') {
                lastUserIndex = i;
                break;
              }
            }
            const historyBeforeAiResponse = prevHistory.slice(0, lastUserIndex + 1);
            const historyAfterAiResponse = prevHistory.slice(lastUserIndex + 1).filter(m => m.sender !== 'ai');
            return [...historyBeforeAiResponse, ...newStreamingBubbles, ...historyAfterAiResponse];
          });
        }
      );

      const monologuePromise = getMonologueResponse(
        historyWithUserMessage as ChatMessage[],
        currentLevel,
        (chunk: string) => {
          monologueFullResponse += chunk;
          setCurrentOS(monologueFullResponse);
        }
      );
      
      await Promise.all([actorPromise, monologuePromise]);

    } catch (e) {
      console.error(e);
      setChatHistory(chatHistory);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < ARENA_LEVELS.length - 1) {
      setCurrentLevelIdx(prev => prev + 1);
    } else {
      alert("恭喜大侠通关！");
      onBack();
    }
  };

  const handleRetry = () => setGameId(prev => prev + 1);

  // 获取心情颜色
  const getMoodColor = (val: number) => {
    if (val < 30) return 'bg-red-500';
    if (val < 60) return 'bg-orange-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="h-screen flex flex-col bg-[#F9FAFB] font-sans relative overflow-hidden">
      <Header title={currentLevel.title} onBack={handleSafeBack} />
      
      {/* 1. 顶部 HUD 仪表盘 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 px-4 py-3 shadow-sm transition-all">
        {/* 好感度条 */}
        <div className="flex items-center gap-3 mb-2">
          <Heart size={16} className={`fill-current ${currentMood < 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${getMoodColor(currentMood)}`}
              style={{ width: `${Math.max(0, Math.min(100, currentMood))}%` }}
            ></div>
          </div>
          <div className="relative min-w-[3rem] text-right">
             <span className={`text-sm font-black ${currentMood < 60 ? 'text-orange-500' : 'text-slate-700'}`}>
                {currentMood}
             </span>
             {/* 飘字特效 */}
             {moodChange !== null && (
                <div key={Date.now()} className={`absolute -top-6 right-0 text-lg font-black animate-bounce whitespace-nowrap pointer-events-none drop-shadow-sm ${moodChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {moodChange > 0 ? '+' : ''}{moodChange}
                </div>
             )}
          </div>
        </div>

        {/* 内心 OS (折叠式胶囊) */}
        {currentOS && !gameOver && (
          <div className="flex justify-center">
             <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 max-w-full animate-[fadeIn_0.5s_ease-out] shadow-sm">
                <BrainCircuit size={12} className="text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 truncate max-w-[280px]">
                  {currentOS.replace(/[（）()]/g, '')}
                </p>
             </div>
          </div>
        )}
      </div>
      
      {/* 2. 聊天流 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50" style={{backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', backgroundSize: '32px 32px'}}>
        {chatHistory.map((msg, idx) => {
          // --- 系统消息 ---
          if (msg.sender === 'system') {
            const isReview = msg.text.startsWith('【师爷点评】');
            const isNotify = msg.text.startsWith('【通知】');

            // 普通通知 (拍一拍)
            if (isNotify) {
              return (
                <div key={idx} className="flex justify-center my-4 opacity-70">
                  <span className="text-xs text-slate-500 bg-slate-200/50 px-3 py-1 rounded-lg">
                    {msg.text.replace('【通知】', '')}
                  </span>
                </div>
              );
            }

            // 最终点评卡片 (战报)
            if (isReview && turnResult) {
              return (
                <div key={idx} className="my-6 mx-2 animate-[slideUp_0.5s_ease-out]">
                  <div className={`relative overflow-hidden bg-white rounded-2xl shadow-xl border-2 ${turnResult.isWin ? 'border-emerald-100' : 'border-red-100'}`}>
                    {/* 顶部装饰条 */}
                    <div className={`h-2 w-full ${turnResult.isWin ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 mb-1">
                            {turnResult.isWin ? '局面大优！' : '崩盘预警'}
                          </h3>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">GAME OVER</div>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${turnResult.isWin ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {turnResult.isWin ? <Trophy size={24} /> : <Frown size={24} />}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <div className="flex gap-2 mb-2">
                          <Sparkles size={14} className="text-slate-400 mt-0.5" />
                          <span className="text-xs font-bold text-slate-500">师爷锐评</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed text-justify font-medium">
                          {msg.text.replace('【师爷点评】\n', '')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
    
            // 开局背景介绍 (Task Card)
            return (
              <div key={idx} className="mx-4 my-4 p-5 bg-white border border-slate-200 shadow-apple rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 group-hover:bg-slate-900 transition-colors"></div>
                <div className="flex gap-3">
                  <div className="mt-0.5 text-slate-400"><Zap size={16} /></div>
                  <div className="text-sm text-slate-600 leading-relaxed font-medium">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          }

          // --- 聊天气泡 ---
          const isAi = msg.sender === 'ai';
          return (
            <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-[slideUp_0.2s_ease-out]`}>
              <div className={`flex max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'} items-end gap-2`}>
                
                {/* 头像 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200 ${isAi ? 'bg-white text-slate-600' : 'bg-slate-900 text-white'}`}>
                   {isAi ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* 气泡本体 - 修复点：边框加深 border-slate-200，文字加深 text-slate-900 */}
                <div className={`px-4 py-2.5 shadow-sm text-[15px] font-medium leading-relaxed
                  ${isAi 
                    ? 'bg-white text-slate-900 rounded-2xl rounded-bl-none border border-slate-200 shadow-md' 
                    : 'bg-slate-900 text-white rounded-2xl rounded-br-none'
                  }`}>
                  {msg.text}
                  {/* 正在输入动效 */}
                  {isTyping && isAi && idx === chatHistory.length - 1 && (
                    <span className="inline-flex gap-1 ml-2 align-baseline">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* 3. 底部操作栏 */}
      {reviewMode && turnResult ? (
        <div className="p-4 bg-white border-t border-slate-200 safe-area-pb">
            <button 
              onClick={turnResult.isWin ? handleNextLevel : handleRetry}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                turnResult.isWin 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
              }`}
            >
              {turnResult.isWin ? <>下一关 <ArrowRight size={18}/></> : <>再试一次 <RefreshCw size={18}/></>}
            </button>
        </div>
      ) : !gameOver ? (
        <div className="p-3 bg-white border-t border-slate-200 safe-area-pb">
          <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-3xl border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition-colors shadow-inner">
            <textarea
              className="flex-1 bg-transparent border-none px-4 py-2.5 max-h-32 min-h-[44px] text-base focus:ring-0 placeholder-slate-400 text-slate-900 resize-none leading-relaxed font-medium"
              placeholder="请输入回复..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isTyping}
              autoFocus
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all mb-0.5 shrink-0 ${
                !inputText.trim() || isTyping
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white shadow-md hover:scale-105 active:scale-95'
              }`}
            >
              <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EQArena;