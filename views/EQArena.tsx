import React, { useState, useEffect, useRef } from 'react';
import { ArenaTurn, ChatMessage } from '../types';
import Header from '../components/Header';
import { getAIResponse, ARENA_LEVELS } from '../services/aiService';
import { Send, BrainCircuit, HeartPulse } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface ChatHistoryItem {
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
  
  // 游戏状态
  const [currentMood, setCurrentMood] = useState(50);
  const [currentOS, setCurrentOS] = useState<string>("（正在观察你的反应...）");

  // 用于流式拆分气泡的 Ref，保存 AI 思考前的历史记录
  const baseHistoryRef = useRef<ChatHistoryItem[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const currentLevel = ARENA_LEVELS[currentLevelIdx];

  // Initialize Level
  useEffect(() => {
    setGameOver(false);
    setTurnResult(null);
    setInputText('');
    
    // Reset Game State
    setCurrentMood(currentLevel.initialMood);
    setCurrentOS(`（${currentLevel.opponentName}正在等待你的回复...）`);
    
    // 构建系统任务卡片内容 (极简版)
    const missionBrief = currentLevel.background;

    // 处理开场白
    const openingParts = currentLevel.openingLine.split('|||');
    
    // 初始聊天记录：系统任务卡 -> AI开场白
    setChatHistory([
      { sender: 'system', text: missionBrief },
      ...openingParts.map(t => ({ sender: 'ai', text: t } as ChatHistoryItem))
    ]);
  }, [currentLevelIdx, gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping, currentOS]);

  const handleSend = async () => {
    if (!inputText.trim() || gameOver) return;

    const userText = inputText;
    setInputText('');
    
    // 1. 添加用户消息
    const newHistory: ChatHistoryItem[] = [...chatHistory, { sender: 'user', text: userText }];
    setChatHistory(newHistory);
    // 保存这一刻的历史记录作为基准
    baseHistoryRef.current = newHistory;

    setIsTyping(true);
    // 临时状态，等数据回来马上会变
    setCurrentOS("（...");
    
    // 添加一个空的 AI 占位气泡
    setChatHistory(prev => [...prev, { sender: 'ai', text: '' }]);

    let fullResponseBuffer = "";
    let hasParsedData = false; // 标记是否已经解析过数据块

    try {
      await getAIResponse('arena', { 
        text: userText,
        levelInfo: currentLevel,
        history: newHistory,
        currentMood: currentMood 
      }, (chunk) => {
        fullResponseBuffer += chunk;

        // 如果还没解析过元数据，尝试寻找 ###DATA### 和 ###TEXT###
        if (!hasParsedData) {
          // 检查是否包含了完整的 DATA 块和 TEXT 标记
          // 格式： ###DATA### {json} ###TEXT### [chat]
          const dataStartIdx = fullResponseBuffer.indexOf('###DATA###');
          const textStartIdx = fullResponseBuffer.indexOf('###TEXT###');

          if (dataStartIdx !== -1 && textStartIdx !== -1) {
            // 提取 JSON 部分
            const jsonStr = fullResponseBuffer.substring(dataStartIdx + 10, textStartIdx).trim();
            
            try {
              const data = JSON.parse(jsonStr);
              // 立即更新 UI (心情 & OS)
              if (data.mood !== undefined) setCurrentMood(data.mood);
              if (data.innerOS) setCurrentOS(data.innerOS);

              if (data.isGameOver) {
                setGameOver(true);
                // 暂存结果，等文字渲染完后再显示弹窗（或者这里其实可以不显示，等用户看完文字）
                // 这里我们先把结果存起来，文字渲染由下面的逻辑继续
                setTurnResult({
                  userReply: userText,
                  aiResponse: "", // 稍后填充
                  isWin: data.isWin,
                  score: data.score,
                  mood: data.mood,
                  innerOS: data.innerOS,
                  analysis: data.analysis
                });
              }
              hasParsedData = true;
              
              // 截断 Buffer，只保留 Text 之后的内容用于气泡渲染
              fullResponseBuffer = fullResponseBuffer.substring(textStartIdx + 10);
            } catch (e) {
              console.error("JSON Parse Error:", e);
              // 如果 JSON 解析失败，可能还没传完，继续等待
            }
          }
        }

        // 渲染气泡文本部分 (无论是否解析了Data，只要有 Text 内容就渲染)
        // 注意：如果 hasParsedData 为 false，fullResponseBuffer 里可能还包含 ###DATA###，我们暂时不渲染，免得把 JSON 漏出来
        // 只有当 hasParsedData 为 true 时，Buffer 里才是纯聊天内容
        if (hasParsedData) {
           const bubbleTexts = fullResponseBuffer.split('|||');
           
           const streamingBubbles = bubbleTexts.map((t, i) => ({
             sender: 'ai',
             text: t,
           } as ChatHistoryItem));

           setChatHistory([
             ...baseHistoryRef.current,
             ...streamingBubbles
           ]);
           
           // 如果游戏结束，更新结果里的 aiResponse
           if (gameOver && turnResult) {
             setTurnResult(prev => prev ? ({ ...prev, aiResponse: fullResponseBuffer.replace(/\|\|\|/g, ' ') }) : null);
           }
        }
      });
      
    } catch (e) {
      alert("对方掉线了，请重试");
      setChatHistory(baseHistoryRef.current);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < ARENA_LEVELS.length - 1) {
      setCurrentLevelIdx(prev => prev + 1);
      setGameId(prev => prev + 1);
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
      <Header title={`第${['一','二','三','四'][currentLevelIdx] || currentLevelIdx+1}回 · ${currentLevel.title}`} onBack={onBack} />
      
      {/* 顶部状态栏：心情 + 读心 */}
      <div className="bg-paper border-b-2 border-ink shadow-sm z-20 flex flex-col">
        {/* 心情条 */}
        <div className="px-4 py-2 flex items-center gap-3 bg-stone-100/50">
          <div className="flex items-center gap-1 text-cinnabar font-bold text-xs tracking-widest shrink-0">
            <HeartPulse size={14} />
            <span>好感</span>
          </div>
          <div className="flex-1 h-3 bg-stone-300 rounded-full overflow-hidden border border-stone-400 relative">
            <div 
              className={`h-full transition-all duration-500 ease-out ${getMoodColor(currentMood)}`}
              style={{ width: `${Math.max(0, Math.min(100, currentMood))}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-ink w-6 text-right">{currentMood}</span>
        </div>

        {/* 读心面板 (OS) */}
        <div className="px-4 py-2 bg-ink/5 border-t border-dashed border-stone-300 flex items-start gap-2">
          <BrainCircuit size={16} className="text-stone-500 mt-0.5 shrink-0" />
          <p className="text-xs text-stone-600 leading-relaxed animate-[fadeIn_0.5s_ease-out]">
            <span className="font-bold text-stone-400 mr-1">对方内心:</span>
            {currentOS}
          </p>
        </div>
      </div>
      
      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ancient" style={{ backgroundImage: 'radial-gradient(#5C5C5C 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#F2ECDC' }}>
        
        {chatHistory.map((msg, idx) => {
          // 渲染系统任务卡片
          if (msg.sender === 'system') {
            return (
              <div key={idx} className="mx-2 my-4 p-4 bg-yellow-50/90 border-2 border-dashed border-ink/40 shadow-sm relative animate-[fadeIn_0.5s_ease-out]">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink text-paper px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] border border-ink shadow-sm">
                   江湖传书
                 </div>
                 <div className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-medium text-justify">
                   {msg.text}
                 </div>
              </div>
            );
          }

          const isAi = msg.sender === 'ai';
          const isLast = idx === chatHistory.length - 1;
          
          return (
            <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-[slideUp_0.2s_ease-out]`}>
              <div className={`flex max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'} items-start gap-2`}>
                <div className={`w-8 h-8 border border-ink flex items-center justify-center flex-shrink-0 bg-paper shadow-[2px_2px_0px_rgba(0,0,0,0.1)] text-xs font-bold`}>
                   {isAi ? '敌' : '我'}
                </div>
                <div className={`p-3 border border-ink text-sm leading-relaxed shadow-[2px_2px_0px_rgba(0,0,0,0.1)] ${
                  isAi ? 'bg-white text-ink' : 'bg-ink text-paper'
                }`}>
                  {msg.text}
                  {isAi && isTyping && isLast && (
                     <span className="inline-block w-1 h-3 ml-1 bg-ink animate-pulse align-middle"></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 结算弹窗 */}
      {gameOver && turnResult && !isTyping && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-paper w-full max-w-sm border-4 border-double border-ink p-6 shadow-2xl relative">
            
            {/* 结果印章 */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 border-4 rounded-full flex flex-col items-center justify-center transform rotate-12 bg-paper shadow-xl z-20 ${
              turnResult.isWin ? 'border-cinnabar text-cinnabar' : 'border-stone-600 text-stone-600'
            }`}>
               <span className="font-black text-3xl writing-vertical tracking-widest">
                 {turnResult.isWin ? '大胜' : '败北'}
               </span>
            </div>

            <div className="mb-6 mt-2">
              <h3 className="font-black text-2xl text-ink mb-1 tracking-widest">
                {turnResult.isWin ? '高情商 · 破局' : '谈崩 · 决裂'}
              </h3>
              <div className="h-1 w-12 bg-cinnabar mb-4"></div>
              
              <div className="bg-stone-100 p-4 border-l-4 border-ink mb-4">
                <p className="text-xs text-stone-400 font-bold mb-1">对手内心真实OS：</p>
                <p className="text-base text-ink font-serif font-medium leading-relaxed">
                  “{turnResult.innerOS}”
                </p>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed text-justify">
                <span className="font-bold text-ink">师爷点评：</span>
                {turnResult.analysis}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dashed border-stone-300">
              <div className="flex flex-col">
                 <span className="text-xs text-stone-400 font-bold">最终心情</span>
                 <span className={`text-2xl font-black ${turnResult.mood < 20 ? 'text-red-600' : 'text-ink'}`}>
                   {turnResult.mood}
                 </span>
              </div>
              <button 
                onClick={turnResult.isWin ? handleNextLevel : handleRetry}
                className={`px-8 py-3 border-2 border-ink font-bold tracking-widest shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
                  turnResult.isWin ? 'bg-cinnabar text-white' : 'bg-white text-ink'
                }`}
              >
                {turnResult.isWin ? '下一关' : '再试一次'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 输入框 */}
      {!gameOver && (
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
      )}
    </div>
  );
};

export default EQArena;