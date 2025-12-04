import React, { useState, useEffect, useRef } from 'react';
import { ArenaTurn, ChatMessage } from '../types';
import Header from '../components/Header';
import { getActorResponse, getMonologueResponse, getJudgeResult, ARENA_LEVELS } from '../services/aiService';
import { generateArenaPoster } from '../utils/posterGenerator'; // 新增这一行import { generatePoster } from '../utils/posterGenerator'; // 【新增】海报生成函数导入
import { Send, BrainCircuit, Heart, Zap, RefreshCw, User, Bot, Sparkles, Trophy, Frown, ArrowRight, Copy, Share2, X, Loader2 } from 'lucide-react';



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

  const [showShareModal, setShowShareModal] = useState(false);
const [shareImage, setShareImage] = useState<string | null>(null);
const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentLevel = ARENA_LEVELS[currentLevelIdx];
  const isGameEndedRef = useRef(false);
  const currentLevelIdRef = useRef(0);

  useEffect(() => {
    setGameOver(false);
    isGameEndedRef.current = false;

    setReviewMode(false);
    setTurnResult(null);
    setInputText('');
    setCurrentMood(currentLevel.initialMood);
    setCurrentOS(`（${currentLevel.opponentName}正在等待你的回复...）`);
    currentLevelIdRef.current = currentLevel.id;

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
    const sendingLevelId = currentLevel.id;
    const userText = inputText;
    setInputText('');
    setIsTyping(true);

    const historyWithUserMessage: ChatHistoryItem[] = [...chatHistory, { sender: 'user', text: userText }];
    setChatHistory(historyWithUserMessage);
    setCurrentOS("");

    let actorFullResponse = "";
    let monologueFullResponse = "";
    
    // ✅ 粘贴这段新代码
    getJudgeResult(
      historyWithUserMessage as ChatMessage[],
      currentLevel,
      currentMood
    ).then(judgeResult => {
      // 如果裁判回来时，发现现在的关卡ID (currentLevelIdRef.current) 
      // 已经不等于我出发时的ID (sendingLevelId) 了
      // 说明用户已经切换到下一关了！这个结果直接作废！
      if (currentLevelIdRef.current !== sendingLevelId) return
      
      // 1. 进门先看锁：如果门焊死了（比赛已结束），直接下班
      if (isGameEndedRef.current) return;

      if (judgeResult) {
        
        // 2. 如果这次判了结局，立马把门焊死，防止后面的裁判再进来
        if (judgeResult.isGameOver) {
            isGameEndedRef.current = true;
        }

        if (judgeResult.isGameOver) {
          // --- 结局处理逻辑 (赢了/输了) ---
          setGameOver(true);
          setCurrentMood(judgeResult.mood); 

          const finalResultData: ArenaTurn = {
            userReply: userText,
            aiResponse: actorFullResponse.replace(/\|{1,3}/g, '\n'),
            isWin: judgeResult.isWin,
            score: judgeResult.score || judgeResult.mood, // 优先用 score
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

        } else {
           // --- 普通对话逻辑 ---
           // 只有门没锁的时候，才允许更新心情，防止心情值乱跳
           if (!isGameEndedRef.current) {
              const diff = judgeResult.mood - currentMood;
              if (diff !== 0) {
                setMoodChange(diff);
                setTimeout(() => setMoodChange(null), 2500);
              }
              setCurrentMood(judgeResult.mood);
           }
        }
      }
    }).catch(console.error);

    try {
      const actorPromise = getActorResponse(
        historyWithUserMessage as ChatMessage[],
        currentLevel,
        (chunk: string) => {
          
          // 👉 【新增 1】如果关卡变了，直接退出
          if (currentLevelIdRef.current !== sendingLevelId) return;

          actorFullResponse += chunk;
          const newStreamingBubbles = actorFullResponse
            .split(/\|{1,3}/)
            .filter(t => t.trim() !== '')
            .map(t => ({ sender: 'ai', text: t } as ChatHistoryItem));

          setChatHistory(prevHistory => {
            // 👉 【新增 2】双重保险：在更新状态前再查一次
            if (currentLevelIdRef.current !== sendingLevelId) return prevHistory;

            let lastUserIndex = -1;
            for (let i = prevHistory.length - 1; i >= 0; i--) {
              if (prevHistory[i].sender === 'user') {
                lastUserIndex = i;
                break;
              }
            }
            if (lastUserIndex === -1) return prevHistory;

            const historyBeforeAiResponse = prevHistory.slice(0, lastUserIndex + 1);
            const historyAfterAiResponse = prevHistory.slice(lastUserIndex + 1).filter(m => m.sender !== 'ai');
            return [...historyBeforeAiResponse, ...newStreamingBubbles, ...historyAfterAiResponse];
          });
        }
      );

      // 找到 const monologuePromise = ... 这一行，替换成：
      const monologuePromise = getMonologueResponse(
        historyWithUserMessage as ChatMessage[],
        currentLevel,
        (chunk: string) => {
          
          // 👉 【新增】如果关卡变了，独白也不许更新
          if (currentLevelIdRef.current !== sendingLevelId) return;

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

        {/* 内心 OS (自适应气泡) */}
        {currentOS && !gameOver && (
          <div className="flex justify-center px-4">
             <div className="inline-flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 max-w-full animate-[fadeIn_0.5s_ease-out] shadow-sm">
                {/* 图标加一点顶部 margin，对齐第一行文字 */}
                <BrainCircuit size={14} className="text-slate-400 shrink-0 mt-0.5" />
                
                {/* 核心改动：移除 truncate，允许换行 */}
                <p className="text-xs text-slate-600 leading-relaxed text-justify break-words">
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
  <div className="p-4 bg-white border-t border-slate-200 safe-area-pb space-y-3">
    {/* 🎉 新增：分享按钮 */}
    <button 
      onClick={async () => {
        setShowShareModal(true);
        setIsGenerating(true);
        try {
          const posterData = await generateArenaPoster(
            turnResult,
            currentLevel,
            chatHistory.filter(m => m.sender !== 'system')
          );
          setShareImage(posterData);
        } catch (e) {
          console.error('海报生成失败:', e);
          alert('生成失败，请重试');
          setShowShareModal(false);
        } finally {
          setIsGenerating(false);
        }
      }}
      className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
    >
      <Share2 size={18}/>
      <span>生成战报海报</span>
    </button>

    {/* 原有的按钮 */}
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
    
   {/* === 分享弹窗 === */}
   {showShareModal && (
        <div 
          onClick={() => setShowShareModal(false)}
          className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[340px] flex flex-col items-center">
            
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 text-white/80 flex items-center justify-center hover:bg-white/30 transition-all active:scale-90 z-50"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-white w-full min-h-[400px]">
              {isGenerating ? (
                <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                  <p className="text-sm font-bold text-slate-600 animate-pulse">正在生成战报...</p>
                </div>
              ) : (
                shareImage && (
                  <img src={shareImage} alt="战报海报" className="w-full h-auto block animate-[fadeIn_0.3s_ease-out]" />
                )
              )}
            </div>

            {shareImage && !isGenerating && (
              <p className="text-white/90 text-xs font-bold mt-5 bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-md animate-bounce shadow-lg">
                长按图片保存 · 发给朋友炫耀
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EQArena;