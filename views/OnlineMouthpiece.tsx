import React, { useState, useRef } from 'react';
import { Plan } from '../types';
import Header from '../components/Header';
import ResultCard from '../components/ResultCard';
import { getAIResponse } from '../services/aiService';
import { Feather, RefreshCw } from 'lucide-react';

interface Props {
  onBack: () => void;
  // Fix: Add initialParams to accept navigation parameters passed from App.tsx
  initialParams?: any;
}

const OnlineMouthpiece: React.FC<Props> = ({ onBack, initialParams }) => {
  const [inputText, setInputText] = useState('');
  
  const [targetRole, setTargetRole] = useState('同事');
  const [customRole, setCustomRole] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [myIntent, setMyIntent] = useState('糊弄他');
  const [customIntent, setCustomIntent] = useState('');
  
  const [relationScore, setRelationScore] = useState(5);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Plan[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const [statusText, setStatusText] = useState('准备中...');

  const parseStreamToPlans = (fullText: string): Plan[] => {
    const startTime = performance.now(); // <-- 在这里加上这行
    console.log('[DEBUG] Enter parseStreamToPlans');

    const rawPlans = fullText.split('===PLAN_START===');
    const parsedPlans: Plan[] = [];

    rawPlans.forEach((block, index) => {
      if (!block.trim()) return;
      
      const titleMatch = block.match(/【标题】(.*?)\n/);
      const title = titleMatch ? titleMatch[1].trim() : `正在构思 Plan ${index}...`;

      const mindsetMatch = block.match(/【心法】(.*?)\n/);
      const mindset = mindsetMatch ? mindsetMatch[1].trim() : (fullText.includes('【心法】') ? '正在推敲...' : '');

      const replyMatches = [...block.matchAll(/【回复】(.*)/g)];
      const replyText = replyMatches.map(m => m[1].trim());

      if (title || mindset || replyText.length > 0) {
        parsedPlans.push({
          id: `stream-${index}`,
          title,
          mindset,
          originalText: inputText.substring(0, 20) + (inputText.length > 20 ? '...' : ''),
          replyText: replyText.length > 0 ? replyText : ['师爷正在提笔...']
        });
      }
    });
    
    const endTime = performance.now();
    console.log(`[DEBUG] Exit parseStreamToPlans. Duration: ${endTime - startTime}ms`);


    return parsedPlans;
  };
  
  const handleGenerate = async () => {
    console.log('[DEBUG] handleGenerate started.');
    
    // --- 1. 基础输入校验 (原逻辑) ---
    if (!inputText.trim()) {
      alert("请告知师爷对方说了什么");
      return;
    }

    // --- 2. 准备参数 (原逻辑 - 之前丢失的部分都在这里) ---
    const finalRole = targetRole === '自定义' ? customRole : targetRole;
    const finalIntent = myIntent === '自定义' ? customIntent : myIntent;

    if (!finalRole.trim()) {
      alert("请输入对方身份");
      return;
    }
    if (!finalIntent.trim()) {
      alert("请输入您的意图");
      return;
    }

    // --- 🔥 3. 核心防卡顿逻辑 (新加部分) ---
    // 如果之前有正在进行的请求，立刻掐断它！
    if (abortControllerRef.current) {
      console.log('[DEBUG] Aborting previous request.');
      
      abortControllerRef.current.abort();
    }
    // 创建一个新的控制器，用于这次请求
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // --- 4. 更新UI状态 ---
    setLoading(true);
    setStatusText('正在研墨...');
    setShowResults(true);
    setResults([]); // 清空旧结果
    
    let accumulatedText = "";

    try {
      console.log('[DEBUG] Starting getAIResponse call.');
        
      // --- 5. 发起请求 ---
      await getAIResponse('online', {
        text: inputText,
        role: finalRole,     // 使用上面计算好的 finalRole
        intent: finalIntent, // 使用上面计算好的 finalIntent
        score: relationScore
      }, (chunk) => {
        console.log('[DEBUG] Received chunk.');

        accumulatedText += chunk;
        const plans = parseStreamToPlans(accumulatedText);
        if (plans.length > 0) {
          console.log('[DEBUG] Setting results.');
         
          setResults(plans);
          setStatusText('师爷正在挥毫...');
        }
      }, controller.signal);
      console.log('[DEBUG] getAIResponse finished.');
     // <--- ✅ 关键：把信号传进去
    } catch (e: any) {
      // --- 6. 错误处理 ---
      // 如果是手动中断(AbortError)，说明是用户点了第二次，这种不算错误，忽略即可
      if (e.name !== 'AbortError') {
        console.error('[DEBUG] Error in getAIResponse:', e);
        console.error(e);
        alert("师爷暂歇，请稍后再试");
        setShowResults(false);
      }
    
    } finally {
      // --- 7. 结束加载状态 ---
      // 只有当当前控制器仍然是本次的控制器时，才结束Loading
      // 这里的逻辑是防止：你点了第二次，导致第一次的 finally 触发，把第二次的 loading 误关了
      if (abortControllerRef.current === controller) {
        console.log('[DEBUG] Finalizing generation.');
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ancient animate-[fadeIn_0.5s_ease-out] font-serif text-ink">
      <Header title="线上嘴替" onBack={onBack} />

      <div className="flex-1 p-5 pb-20 overflow-y-auto no-scrollbar">
        
        {/* 表单区域：药方样式 */}
        <div className={`transition-all duration-500 space-y-8 ${showResults ? 'hidden' : 'block'}`}>
          
          {/* 顶部提示 */}
          <div className="flex items-center gap-3 text-ink opacity-60">
              <Feather size={16} />
              <span className="text-sm font-bold tracking-widest border-b border-ink/30 pb-1">
                  请呈上聊天记录，师爷为您斟酌措辞
              </span>
          </div>

          {/* 对方原话：下划线批注风格 */}
          <div className="space-y-4">
            <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
              <span className="w-1 h-6 bg-ink inline-block"></span>
              对方原话
            </label>
            <textarea
              className="w-full bg-transparent border-b-2 border-stone-400 p-2 text-base outline-none focus:border-ink transition-colors placeholder-stone-400 text-ink font-bold resize-none h-20"
              placeholder="请粘贴聊天记录..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* 对方身份 */}
          <div className="space-y-4">
            <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
              <span className="w-1 h-6 bg-ink inline-block"></span>
              对方身份
            </label>
            <div className="flex flex-wrap gap-3">
              {['同事', '亲戚', '客户', '上司'].map(role => (
                <button
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`px-4 py-3 text-sm font-bold border-2 transition-all duration-200 ${
                    targetRole === role 
                    ? 'bg-cinnabar text-white border-cinnabar shadow-[3px_3px_0px_#2B2B2B]' 
                    : 'bg-transparent text-stone-600 border-stone-400 hover:border-ink hover:text-ink'
                  }`}
                >
                  {role}
                </button>
              ))}
              <button
                onClick={() => setTargetRole('自定义')}
                className={`px-4 py-3 text-sm font-bold border-2 transition-all duration-200 ${
                  targetRole === '自定义'
                  ? 'bg-cinnabar text-white border-cinnabar shadow-[3px_3px_0px_#2B2B2B]' 
                  : 'bg-transparent text-stone-600 border-stone-400 hover:border-ink hover:text-ink'
                }`}
              >
                自定义
              </button>
            </div>
            {targetRole === '自定义' && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full bg-transparent border-b border-ink/50 p-2 outline-none text-ink placeholder-stone-400 text-sm font-bold"
                  placeholder="请输入身份（如：前任、房东）"
                />
              </div>
            )}
          </div>

          {/* 我的意图 */}
          <div className="space-y-4">
            <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
              <span className="w-1 h-6 bg-ink inline-block"></span>
              我的意图
            </label>
            <div className="flex flex-wrap gap-3">
              {['答应Ta', '糊弄Ta', '拒绝Ta'].map(intent => (
                <button
                  key={intent}
                  onClick={() => setMyIntent(intent)}
                  className={`px-4 py-3 text-sm font-bold border-2 transition-all duration-200 ${
                    myIntent === intent 
                    ? 'bg-cinnabar text-white border-cinnabar shadow-[3px_3px_0px_#2B2B2B]' 
                    : 'bg-transparent text-stone-600 border-stone-400 hover:border-ink hover:text-ink'
                  }`}
                >
                  {intent}
                </button>
              ))}
              <button
                onClick={() => setMyIntent('自定义')}
                className={`px-4 py-3 text-sm font-bold border-2 transition-all duration-200 ${
                  myIntent === '自定义'
                  ? 'bg-cinnabar text-white border-cinnabar shadow-[3px_3px_0px_#2B2B2B]' 
                  : 'bg-transparent text-stone-600 border-stone-400 hover:border-ink hover:text-ink'
                }`}
              >
                自定义
              </button>
            </div>
            {myIntent === '自定义' && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <input
                  type="text"
                  value={customIntent}
                  onChange={(e) => setCustomIntent(e.target.value)}
                  className="w-full bg-transparent border-b border-ink/50 p-2 outline-none text-ink placeholder-stone-400 text-sm font-bold"
                  placeholder="请输入意图（如：想借钱、想表白）"
                />
              </div>
            )}
          </div>

          {/* 亲疏程度 */}
          <div className="space-y-4 pt-4 border-t border-dashed border-stone-400">
            <div className="flex justify-between items-center">
              <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
                <span className="w-1 h-6 bg-stone-400 inline-block"></span>
                亲疏程度
              </label>
              <span className="text-xl font-black text-ink">{relationScore}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={relationScore}
              onChange={(e) => setRelationScore(Number(e.target.value))}
              className="w-full h-2 bg-stone-300 appearance-none cursor-pointer rounded-full accent-cinnabar"
            />
            <div className="flex justify-between text-xs font-bold text-stone-500">
              <span>萍水相逢</span>
              <span>莫逆之交</span>
            </div>
          </div>

          {/* 生成按钮 */}
          <div className="pt-6">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 border-2 border-ink font-bold text-xl text-paper shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-3 ${
                loading ? 'bg-stone-500 cursor-not-allowed' : 'bg-ink hover:bg-black'
              }`}
            >
              {loading ? (
                <span className="tracking-widest animate-pulse">{statusText}</span>
              ) : (
                <>
                  <Feather size={20} />
                  <span className="tracking-[0.3em]">求计问策</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 结果区 */}
        {showResults && (
          <div className="animate-[slideUp_0.4s_ease-out]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-ink pb-2 border-double">
              <h2 className="text-xl font-black text-ink tracking-widest">
                {loading ? '推演中...' : '锦囊妙计'}
              </h2>
              {/* 修改：重设按钮改为刷新当前结果 */}
              <button 
                onClick={handleGenerate} 
                className="text-xs font-bold text-stone-500 hover:text-ink flex items-center gap-1 active:rotate-180 transition-transform"
                disabled={loading}
              >
                <RefreshCw size={12}/> 换一批
              </button>
            </div>
            
            <div className="space-y-4">
              {results.length === 0 && loading && (
                <div className="text-center py-10 text-stone-400 font-serif font-medium animate-pulse">
                  师爷正在研墨...
                </div>
              )}
              
              {results.map((plan) => (
                <div key={plan.id} className="animate-[fadeIn_0.3s_ease-out]">
                  <ResultCard 
                    plan={plan} 
                    type="online" 
                    contextData={[
                      { label: "对方", value: targetRole === '自定义' ? customRole : targetRole },
                      { label: "意图", value: myIntent === '自定义' ? customIntent : myIntent },
                      { label: "关系分", value: `${relationScore} / 10` },
                      
                      // 👇 关键：这里的 label 必须是 '原话'，不要改别的
                      { label: "原话", value: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : '') } 
                    ]}
                    
                    onRegenerateSingle={() => {}} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineMouthpiece;
