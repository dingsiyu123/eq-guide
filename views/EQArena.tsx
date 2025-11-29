import React, { useState, useEffect, useRef } from 'react';
import { ArenaTurn, ChatMessage } from '../types';
import Header from '../components/Header';
import { getActorResponse, getMonologueResponse, getJudgeResult, ARENA_LEVELS } from '../services/aiService';
import { Send, BrainCircuit, HeartPulse, RefreshCw } from 'lucide-react';

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

  const bottomRef = useRef<HTMLDivElement>(null);
  const currentLevel = ARENA_LEVELS[currentLevelIdx];

  useEffect(() => {
    setGameOver(false);
    setReviewMode(false);
    setTurnResult(null);
    setInputText('');
    setCurrentMood(currentLevel.initialMood);
    setCurrentOS(`（${currentLevel.opponentName}正在等待你的回复...）`);
    
    const openingParts = currentLevel.openingLine.split('|||');
    setChatHistory([
      { sender: 'system', text: currentLevel.missionBrief as string },
      ...openingParts.map(t => ({ sender: 'ai', text: t } as ChatHistoryItem))
    ]);
  }, [currentLevelIdx, gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping, currentOS]);

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
    let streamingActorBubbles: ChatHistoryItem[] = [];

    try {
      // 步骤1：恢复并行请求，保证即时响应速度
      const actorPromise = getActorResponse(
        historyWithUserMessage as ChatMessage[],
        currentLevel,
        (chunk: string) => {
          actorFullResponse += chunk;
          const bubbleTexts = actorFullResponse.split('|||').filter(t => t.trim() !== '');
          streamingActorBubbles = bubbleTexts.map(t => ({ sender: 'ai', text: t } as ChatHistoryItem));
          setChatHistory([...historyWithUserMessage, ...streamingActorBubbles]);
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
      
      const judgePromise = getJudgeResult(
        historyWithUserMessage as ChatMessage[],
        currentLevel,
        currentMood
      );

      // 等待所有并行请求完成
      const [_, __, judgeResult] = await Promise.all([actorPromise, monologuePromise, judgePromise]);

      if (judgeResult) {
        setCurrentMood(judgeResult.mood);
        
        // 步骤2：检查游戏是否结束
        if (judgeResult.isGameOver) {
          setGameOver(true);

          // 步骤3：如果游戏结束，则根据最终结果再次获取正确的台词和内心戏
          const finalSystemInstruction = `【系统指令】游戏已结束。最终赛果是：${judgeResult.isWin ? '你赢了' : '你输了'}。请根据这个结果，说出你最后的台词和最终的内心想法。`;
          const finalHistory: ChatMessage[] = [
            ...(historyWithUserMessage as ChatMessage[]),
            { id: 'system-final-instruction', sender: 'system', text: finalSystemInstruction }
          ];

          let finalActorResponse = "";
          let finalMonologueResponse = "";
          
          // 在后台获取最终的、符合逻辑的回复
          const finalActorPromise = getActorResponse(finalHistory, currentLevel, chunk => { finalActorResponse += chunk; });
          const finalMonologuePromise = getMonologueResponse(finalHistory, currentLevel, chunk => { finalMonologueResponse += chunk; });
          
          await Promise.all([finalActorPromise, finalMonologuePromise]);

          const finalResultData: ArenaTurn = {
            userReply: userText,
            aiResponse: finalActorResponse.replace(/\|\|\|/g, '\n'),
            isWin: judgeResult.isWin,
            score: judgeResult.mood,
            mood: judgeResult.mood,
            innerOS: finalMonologueResponse,
            analysis: judgeResult.analysis,
            funnyReaction: judgeResult.funnyReaction,
          };
          
          setTurnResult(finalResultData);

          // 步骤4：用最终正确的台词更新UI
          const finalActorBubbles = finalActorResponse.split('|||').filter(t => t.trim() !== '').map(t => ({ sender: 'ai', text: t } as ChatHistoryItem));
          setChatHistory([...historyWithUserMessage, ...finalActorBubbles]);

          // 只在游戏胜利时显示彩蛋
          if (finalResultData.isWin && finalResultData.funnyReaction) {
            setTimeout(() => {
              setChatHistory(prev => [
                ...prev,
                { sender: 'system', text: `【通知】${finalResultData.funnyReaction}` }
              ]);
            }, 600);
          }

          setTimeout(() => {
            setChatHistory(prev => [
              ...prev,
              { sender: 'system', text: `【师爷点评】\n${finalResultData.analysis}` }
            ]);
            setReviewMode(true);
          }, 1200);

        } 
        // 移除了游戏未结束时的彩蛋逻辑，彻底修复bug
      }

    } catch (e) {
      console.error("An error occurred in handleSend:", e);
      alert("对方掉线了，请检查网络或刷新重试");
      // 回滚到用户发送前的状态
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

  const handleRetry = () => {
    setGameId(prev => prev + 1);
  };

  const getMoodColor = (val: number) => {
    if (val < 20) return 'bg-red-600';
    if (val < 50) return 'bg-orange-500';
    if (val < 80) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  return (
    <div className="h-screen flex flex-col bg-ancient font-serif relative overflow-hidden">
      <Header title={currentLevel.title} onBack={onBack} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-paper border-b-2 border-ink shadow-sm z-10 flex flex-col">
          <div className="px-4 py-2 flex items-center gap-3 bg-stone-100/50">
            <HeartPulse size={14} className="text-cinnabar" />
            <span className="font-bold text-xs tracking-widest shrink-0 text-cinnabar">好感</span>
            <div className="flex-1 h-3 bg-stone-300 rounded-full overflow-hidden border border-stone-400 relative">
              <div 
                className={`h-full transition-all duration-500 ease-out ${getMoodColor(currentMood)}`}
                style={{ width: `${Math.max(0, Math.min(100, currentMood))}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-ink w-6 text-right">{currentMood}</span>
          </div>
          <div className="px-4 py-2 bg-ink/5 border-t border-dashed border-stone-300 flex items-start gap-2">
            <BrainCircuit size={16} className="text-stone-500 mt-0.5 shrink-0" />
            <p className="text-xs text-stone-600 leading-relaxed animate-[fadeIn_0.5s_ease-out]">
              <span className="font-bold text-stone-400 mr-1">对方内心:</span>
              {currentOS}
            </p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundImage: 'radial-gradient(#5C5C5C 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#F2ECDC' }}>
          {chatHistory.map((msg, idx) => {
                        if (msg.sender === 'system') {
                          const isReviewCard = msg.text.startsWith('【师爷点评】');
                          const isNotification = msg.text.startsWith('【通知】');

                          // 新增：渲染“拍一拍”通知
                          if (isNotification) {
                            return (
                              <div key={idx} className="py-2 my-2 flex justify-center items-center animate-[fadeIn_0.5s_ease-out]">
                                <span className="text-xs text-stone-500 bg-stone-200/80 px-4 py-1.5 rounded-full shadow-inner">
                                  {msg.text.replace('【通知】', '')}
                                </span>
                              </div>
                            );
                          }

                          // 渲染最终的“师爷点评”卡片 (注意：内部的彩蛋部分已被移除)
                          if (isReviewCard) {
                            return (
                              <div key={idx} className="animate-[fadeIn_0.5s_ease-out] my-4 flex flex-col items-center">
                                <div className="relative flex flex-col sm:flex-row items-center gap-6 mx-auto w-full max-w-lg bg-yellow-50/95 p-6 shadow-md border-2 border-dashed border-ink/40">
                                  <div className="flex-grow">
                                    <p className="text-ink/90 text-sm font-medium font-serif leading-relaxed whitespace-pre-wrap text-justify">
                                      {msg.text.replace('【师爷点评】\n', '')}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center mt-4 sm:mt-0">
                                    <div className="relative w-20 h-20 border-4 border-cinnabar/90 rounded-full flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                                      <span className="text-4xl font-black text-cinnabar" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
                                        {turnResult?.isWin ? '完胜' : '惜败'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                  
                          // 否则，使用原来的“江湖传书”样式
                          return (
                            <div key={idx} className="mx-2 my-4 p-4 border-2 shadow-sm relative bg-yellow-50/90 border-dashed border-ink/40">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-paper px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] border shadow-sm bg-ink border-ink">
                                江湖传书
                              </div>
                              <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium text-justify text-stone-700">
                                {msg.text}
                              </div>
                            </div>
                          );
                        }
            const isAi = msg.sender === 'ai';
            return (
              <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-[slideUp_0.2s_ease-out]`}>
                <div className={`flex max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'} items-start gap-2`}>
                  <div className={`w-8 h-8 border border-ink flex items-center justify-center flex-shrink-0 bg-paper shadow-[2px_2px_0px_rgba(0,0,0,0.1)] text-xs font-bold`}>
                     {isAi ? '敌' : '我'}
                  </div>
                  <div className={`p-3 border border-ink text-sm leading-relaxed shadow-[2px_2px_0px_rgba(0,0,0,0.1)] ${isAi ? 'bg-white text-ink' : 'bg-ink text-paper'}`}>
                    {msg.text}
                    {isTyping && isAi && idx === chatHistory.length - 1 && (<span className="inline-block w-1 h-3 ml-1 bg-ink animate-pulse align-middle"></span>)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {reviewMode && turnResult ? (
        <div className="p-3 bg-paper border-t-2 border-ink flex items-center justify-center gap-4">
            <button 
              onClick={turnResult.isWin ? handleNextLevel : handleRetry}
              className={`w-full py-3 border-2 border-ink font-bold tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                turnResult.isWin ? 'bg-cinnabar text-white' : 'bg-stone-600 text-white'
              }`}
            >
              {turnResult.isWin ? '下一关' : '再试一次'}
            </button>
        </div>
      ) : !gameOver ? (
        <div className="p-3 bg-paper border-t-2 border-ink flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-white border-2 border-stone-300 px-4 py-3 outline-none text-sm focus:border-ink transition-colors font-serif placeholder-stone-400 text-ink shadow-inner"
            placeholder="请出招..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-12 h-12 bg-ink text-white border-2 border-ink flex items-center justify-center hover:bg-stone-800 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,0.2)] disabled:opacity-50 active:translate-y-1 active:shadow-none"
          >
            <Send size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default EQArena;