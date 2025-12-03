import React, { useState, useRef } from 'react';
import { Plan } from '../types';
import Header from '../components/Header';
import ResultCard from '../components/ResultCard';
import { getAIResponse } from '../services/aiService';
import { Sparkles, RefreshCw, Image as ImageIcon, Type, Eraser } from 'lucide-react';

interface Props {
  onBack: () => void;
  initialParams?: any;
}

const OnlineMouthpiece: React.FC<Props> = ({ onBack, initialParams }) => {
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [targetRole, setTargetRole] = useState('同事');
  const [customRole, setCustomRole] = useState('');
  const [myIntent, setMyIntent] = useState('糊弄Ta');
  const [customIntent, setCustomIntent] = useState('');
  const [relationScore, setRelationScore] = useState(5);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Plan[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [statusText, setStatusText] = useState('AI 思考中...');
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // ... (parseStreamToPlans 逻辑保持不变，复制你原来的即可) ...
  const parseStreamToPlans = (fullText: string): Plan[] => {
    const rawPlans = fullText.split('===PLAN_START===');
    const parsedPlans: Plan[] = [];
    rawPlans.forEach((block, index) => {
      if (!block.trim()) return;
      const titleMatch = block.match(/【标题】(.*?)\n/);
      const mindsetMatch = block.match(/【心法】(.*?)\n/);
      const replyMatches = [...block.matchAll(/【回复】(.*)/g)];
      
      if (titleMatch) {
        parsedPlans.push({
          id: `stream-${index}`,
          title: titleMatch[1].trim(),
          mindset: mindsetMatch ? mindsetMatch[1].trim().replace(/^["“]|["”]$/g, '') : '',
          originalText: inputText || '',
          replyText: replyMatches.map(m => m[1].trim())
        });
      }
    });
    return parsedPlans;
  };

  const handleGenerate = async () => {
    // ... (handleGenerate 逻辑保持不变，复制你原来的即可) ...
    const finalRole = targetRole === '自定义' ? customRole : targetRole;
    const finalIntent = myIntent === '自定义' ? customIntent : myIntent;
    if (!finalRole || !finalIntent) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setStatusText('正在推演...');
    setShowResults(true);
    setResults([]);
    lastUpdateRef.current = 0;
    
    let accumulatedText = "";

    try {
      await getAIResponse('online', {
        text: inputText || "【无原话，本次为用户想主动发起对话】",
        role: finalRole,
        intent: finalIntent,
        score: relationScore
      }, (chunk) => {
        accumulatedText += chunk;
        const now = Date.now();
        if (now - lastUpdateRef.current > 100 || chunk.includes('PLAN_END')) {
            const plans = parseStreamToPlans(accumulatedText);
            if (plans.length > 0) setResults(plans);
            lastUpdateRef.current = now;
        }
      }, controller.signal);
    } catch (e: any) {
       console.error(e);
    } finally {
       setLoading(false);
    }
  };

  // 清空文本的辅助函数
  const clearText = () => setInputText('');

  // 🆕 新增：构造 Context Data 用于海报生成
  const getContextData = () => {
    const finalRole = targetRole === '自定义' ? customRole : targetRole;
    const finalIntent = myIntent === '自定义' ? customIntent : myIntent;
    
    // 注意：这里不需要传 '对方原话'，因为 posterGenerator 里 plan 对象本身就包含了 originalText
    // generator 会自动处理原话的显示。这里只传标签数据。
    return [
      { label: '对方身份', value: finalRole },
      { label: '我的意图', value: finalIntent },
      { label: '关系分', value: `${relationScore}/10` }
    ];
  };

  return (
    // 背景色更纯净
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-slate-900">
      {/* 这里的 Title 已经通过 Header 组件修改了 */}
      <Header title="线上嘴替" onBack={onBack} />

      <div className="flex-1 max-w-2xl mx-auto w-full p-5 pb-32">
        
        {/* === 表单区域 === */}
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showResults ? 'hidden' : 'block'}`}>
          
          {/* 1. 输入卡片：完全去边框，只保留阴影 */}
          <div className="bg-white rounded-3xl shadow-apple p-1 mb-8 overflow-hidden group hover:shadow-apple-hover transition-shadow duration-300">
            {/* 顶部 Tab 切换 */}
            <div className="flex items-center gap-1 p-1 bg-slate-50/50 m-1 rounded-2xl">
              <button
                onClick={() => setInputType('text')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  inputType === 'text' 
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Type size={16} /> 粘贴文字
              </button>
              <button
                onClick={() => setInputType('image')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  inputType === 'image' 
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <ImageIcon size={16} /> 上传截图
              </button>
            </div>

            {/* 内容输入区 */}
            <div className="px-5 py-4 relative">
              {inputType === 'text' ? (
                <>
                  <textarea
                    className="w-full bg-transparent border-none p-0 text-[17px] placeholder-slate-300 text-slate-800 font-medium resize-none h-40 focus:ring-0 leading-relaxed tracking-wide"
                    placeholder="把对方发来的话粘贴在这里..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                  />
                  {inputText && (
                    <button 
                      onClick={clearText}
                      className="absolute bottom-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-2"
                    >
                      <Eraser size={18} />
                    </button>
                  )}
                </>
              ) : (
                <div 
                  className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => alert("功能开发中")}
                >
                  <ImageIcon size={28} className="mb-2 opacity-50" />
                  <span className="text-xs font-bold opacity-70">点击上传聊天截图</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. 身份与意图选择：更紧凑的布局 */}
          <div className="space-y-8 px-1">
            
            {/* 对方身份 */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block px-1">
                对方身份
              </label>
              <div className="flex flex-wrap gap-2.5">
                {['同事', '亲戚', '客户', '上司', '自定义'].map(role => (
                  <button
                    key={role}
                    onClick={() => setTargetRole(role)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                      targetRole === role 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.02]' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {targetRole === '自定义' && (
                <div className="mt-3 animate-[fadeIn_0.2s_ease-out]">
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 py-2 px-1 text-slate-900 placeholder-slate-300 text-base font-medium focus:border-slate-900 outline-none transition-colors"
                    placeholder="输入具体身份 (如: 前任)"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 我的意图 */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block px-1">
                我的意图
              </label>
              <div className="flex flex-wrap gap-2.5">
                {['答应Ta', '糊弄Ta', '拒绝Ta', '自定义'].map(intent => (
                  <button
                    key={intent}
                    onClick={() => setMyIntent(intent)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                      myIntent === intent 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.02]' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
              {myIntent === '自定义' && (
                <div className="mt-3 animate-[fadeIn_0.2s_ease-out]">
                  <input
                    type="text"
                    value={customIntent}
                    onChange={(e) => setCustomIntent(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 py-2 px-1 text-slate-900 placeholder-slate-300 text-base font-medium focus:border-slate-900 outline-none transition-colors"
                    placeholder="输入具体意图 (如: 想借钱)"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 亲疏程度滑块：更现代的样式 */}
            <div className="pt-2">
              <div className="flex justify-between items-end mb-4 px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  关系亲疏
                </label>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{relationScore}</span>
                  <span className="text-sm font-bold text-slate-300 ml-1">/ 10</span>
                </div>
              </div>
              
              {/* 自定义滑块容器 */}
              <div className="relative h-6 flex items-center">
                {/* 轨道背景 */}
                <div className="absolute w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-slate-200 to-slate-400" style={{ width: `${relationScore * 10}%` }}></div>
                </div>
                {/* 原生滑块覆盖在上面，透明，只保留交互 */}
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={relationScore}
                  onChange={(e) => setRelationScore(Number(e.target.value))}
                  className="w-full h-full opacity-0 cursor-pointer absolute z-10"
                />
                {/* 模拟滑块头 */}
                <div 
                  className="w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md absolute pointer-events-none transition-all flex items-center justify-center"
                  style={{ left: `calc(${relationScore * 10}% - 12px)` }}
                >
                  <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
                <span>萍水相逢</span>
                <span>生死之交</span>
              </div>
            </div>

          </div>

          {/* 生成按钮：底部悬浮或者大通栏 */}
          <div className="mt-12 px-1">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                loading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-black'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>师爷思考中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} className="text-yellow-400 fill-current" />
                  <span>生成高情商回复</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* === 结果区域 === */}
        {showResults && (
          <div className="animate-[slideUp_0.4s_ease-out]">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cinnabar rounded-full inline-block shadow-sm"></span>
                锦囊妙计
              </h2>
              <button 
                onClick={handleGenerate} 
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 active:scale-95 transition-all"
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''}/> 
                <span>换一批</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {results.length === 0 && loading && (
                <div className="text-center py-20">
                  <div className="inline-block p-4 rounded-full bg-slate-50 mb-4 animate-pulse">
                    <Sparkles size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium text-sm">师爷正在斟酌措辞...</p>
                </div>
              )}
              
              {results.map((plan) => (
                <ResultCard 
                  key={plan.id}
                  plan={plan} 
                  type="online" 
                  contextData={getContextData()} // ⚠️ 修复：传入构造好的数据
                  onRegenerateSingle={() => {}} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineMouthpiece;