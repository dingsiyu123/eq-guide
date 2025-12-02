import React, { useState, useRef } from 'react';
import { Plan } from '../types';
import Header from '../components/Header';
import ResultCard from '../components/ResultCard';
import { getAIResponse } from '../services/aiService';
import { Feather, RefreshCw, Image as ImageIcon, Type } from 'lucide-react';

interface Props {
  onBack: () => void;
  // Fix: Add initialParams to accept navigation parameters passed from App.tsx
  initialParams?: any;
}

const OnlineMouthpiece: React.FC<Props> = ({ onBack, initialParams }) => {
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 新增：错误状态
  const lastUpdateRef = useRef<number>(0); // 新增：用于节流的时间戳

  const parseStreamToPlans = (fullText: string): Plan[] => {
    const startTime = performance.now(); // <-- 在这里加上这行
    

    const rawPlans = fullText.split('===PLAN_START===');
    const parsedPlans: Plan[] = [];

    rawPlans.forEach((block, index) => {
      if (!block.trim()) return;
      
      const titleMatch = block.match(/【标题】(.*?)\n/);
      const title = titleMatch ? titleMatch[1].trim() : `正在构思 Plan ${index}...`;

      const mindsetMatch = block.match(/【心法】(.*?)\n/);
      // 增加正则替换：去掉开头和结尾的 " 或 “ 或 ”
      const mindset = mindsetMatch 
        ? mindsetMatch[1].trim().replace(/^["“]|["”]$/g, '') 
        : (fullText.includes('【心法】') ? '正在推敲...' : ''); 
      const replyMatches = [...block.matchAll(/【回复】(.*)/g)];
      const replyText = replyMatches.map(m => m[1].trim());

      if (title || mindset || replyText.length > 0) {
        parsedPlans.push({
          id: `stream-${index}`,
          title,
          mindset,
          // 如果没字，就传空串，不要自作聪明加省略号
          originalText: inputText || '',
          replyText: replyText.length > 0 ? replyText : ['师爷正在提笔...']
        });
      }
    });
    
    const endTime = performance.now();
    


    return parsedPlans;
  };
  
  // 👇 把原来的 handleGenerate 删掉，换成这个新的：
  const handleGenerate = async () => {
    // 1. 准备参数
    const finalRole = targetRole === '自定义' ? customRole : targetRole;
    const finalIntent = myIntent === '自定义' ? customIntent : myIntent;

    if (!finalRole.trim()) { alert("请输入对方身份"); return; }
    if (!finalIntent.trim()) { alert("请输入您的意图"); return; }

    // 2. 中断旧请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 3. 重置状态
    setLoading(true);
    setStatusText('正在研墨...');
    setShowResults(true);
    setResults([]); 
    setErrorMsg(null); // 清空错误
    lastUpdateRef.current = 0; // 重置计时器
    
    let accumulatedText = "";

    try {
      const textPayload = inputText.trim() === '' ? "【无原话，本次为用户想主动发起对话】" : inputText;

      // 4. 调用 AI
      await getAIResponse('online', {
        text: textPayload,
        role: finalRole,
        intent: finalIntent,
        score: relationScore
      }, (chunk) => {
        accumulatedText += chunk;

        // --- 动态提示 ---
        if (accumulatedText.includes('【回复】')) setStatusText('师爷正在润色...');
        else if (accumulatedText.includes('【心法】')) setStatusText('师爷正在推敲心法...');
        else if (accumulatedText.includes('【标题】')) setStatusText('师爷正在拟定计策...');

        // --- 🔥 核心修复：节流 (Throttle) ---
        // 只有距离上次更新超过 100ms，才更新界面，防止卡死
        const now = Date.now();
        if (now - lastUpdateRef.current > 100 || chunk.includes('PLAN_END')) {
            const plans = parseStreamToPlans(accumulatedText);
            if (plans.length > 0) {
                setResults(plans);
            }
            lastUpdateRef.current = now;
        }
      }, controller.signal);

      // 5. 结束后确保最后一次更新
      const finalPlans = parseStreamToPlans(accumulatedText);
      if (finalPlans.length > 0) setResults(finalPlans);

    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        setErrorMsg("网络波动，师爷暂歇。请检查网络或稍后再试。"); // 设置错误信息
        setLoading(false); 
      }
    } finally {
      if (abortControllerRef.current === controller) {
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
          
          

          {/* 对方原话：书签 Tab 风格 */}
          <div className="space-y-2">
            
            {/* Tab 导航栏：像古籍的书签一样排列 */}
            <div className="flex items-end gap-6 border-b-2 border-ink/10 px-1">
              {/* Tab 1: 文字 */}
              <button
                onClick={() => setInputType('text')}
                className={`pb-2 text-lg font-black tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  inputType === 'text' 
                    ? 'text-ink border-b-[3px] border-ink translate-y-[2px]' 
                    : 'text-stone-400 hover:text-stone-600 border-b-[3px] border-transparent'
                }`}
              >
                <Feather size={18} className={inputType === 'text' ? 'animate-pulse' : ''} />
                <span>誊录原话</span>
              </button>

              {/* Tab 2: 截图 */}
              <button
                onClick={() => setInputType('image')}
                className={`pb-2 text-lg font-black tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  inputType === 'image' 
                    ? 'text-ink border-b-[3px] border-ink translate-y-[2px]' 
                    : 'text-stone-400 hover:text-stone-600 border-b-[3px] border-transparent'
                }`}
              >
                <ImageIcon size={18} />
                <span>呈递截图</span>
              </button>
            </div>

            {/* 内容区：根据 Tab 切换 */}
            <div className="pt-2 min-h-[100px]">
              {inputType === 'text' ? (
                <textarea
                  className="w-full bg-transparent border-none p-2 text-base outline-none focus:ring-0 placeholder-stone-400 text-ink font-bold font-serif resize-none h-24 leading-relaxed animate-[fadeIn_0.3s_ease-out]"
                  placeholder="请粘贴对方原话，若需主动发起对话，此栏留空即可..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  autoFocus
                />
              ) : (
                // 截图占位区：宣纸风格
                <div 
                  onClick={() => alert("📷 师爷正在闭关修炼“读图术”...\n\n（直接发截图的功能开发中，敬请期待！）")}
                  className="w-full h-24 border-2 border-dashed border-stone-300 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-cinnabar hover:bg-cinnabar/5 transition-all group animate-[fadeIn_0.3s_ease-out] relative overflow-hidden bg-stone-50/50"
                >
                  <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-stone-200 group-hover:bg-cinnabar group-hover:text-white flex items-center justify-center transition-colors text-stone-500">
                      <ImageIcon size={16} />
                    </div>
                    <span className="text-sm font-serif font-bold text-stone-500 group-hover:text-cinnabar tracking-widest">
                      点击上传聊天截图
                    </span>
                  </div>
                </div>
              )}
            </div>
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
