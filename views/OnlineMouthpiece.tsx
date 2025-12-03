import React, { useState, useRef } from 'react';
import { Plan } from '../types';
import Header from '../components/Header';
import ResultCard from '../components/ResultCard';
import { getAIResponse } from '../services/aiService';
import { Sparkles, RefreshCw, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  onBack: () => void;
  initialParams?: any;
}

const OnlineMouthpiece: React.FC<Props> = ({ onBack, initialParams }) => {
  // 1. 状态管理
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // 新增：存图片
  
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. 辅助函数：解析流式数据
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
          originalText: inputText || (selectedImage ? '【聊天记录截图】' : '【主动发起】'),
          replyText: replyMatches.map(m => m[1].trim())
        });
      }
    });
    return parsedPlans;
  };

  // 3. 图片选择处理 (只存不发)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // --- 开始压缩逻辑 ---
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // 创建画布
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 设置最大尺寸 (比如宽或高不超过 1024px，足够 AI 看清文字了)
        const MAX_SIZE = 1024;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 压缩并转为 Base64 (质量 0.6 足够清晰且体积小)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        // 存入状态
        setSelectedImage(compressedBase64);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // 清空 input
    e.target.value = '';
  };

  // 4. 统一生成函数
  const handleGenerate = async () => {
    const finalRole = targetRole === '自定义' ? customRole : targetRole;
    const finalIntent = myIntent === '自定义' ? customIntent : myIntent;
    
    // 校验：必须有图或者有字
    if (!inputText.trim() && !selectedImage) {
      alert('请至少输入文字或上传一张截图');
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    // 根据输入类型显示不同的提示
    setStatusText(selectedImage ? '师爷正在读图...' : '师爷正在斟酌...');
    setShowResults(true);
    setResults([]);
    lastUpdateRef.current = 0;
    
    let accumulatedText = "";

    try {
      await getAIResponse('online', {
        image: selectedImage, // 有图传图
        text: inputText,      // 有字传字
        role: finalRole || '对方',
        intent: finalIntent || '高情商回复',
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
       if (e.name !== 'AbortError') console.error(e);
    } finally {
       setLoading(false);
    }
  };

  const getContextData = () => {
    const finalRole = targetRole === '自定义' ? customRole : targetRole;
    const finalIntent = myIntent === '自定义' ? customIntent : myIntent;
    return [
      { label: '对方身份', value: finalRole },
      { label: '我的意图', value: finalIntent },
      { label: '关系分', value: `${relationScore}/10` }
    ];
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-slate-900">
      <Header title="线上嘴替" onBack={onBack} />

      <div className="flex-1 max-w-2xl mx-auto w-full p-5 pb-32">
        
        {/* === 表单区域 === */}
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showResults ? 'hidden' : 'block'}`}>
          
          {/* 1. 一体化输入卡片 */}
          <div className="bg-white rounded-3xl shadow-apple p-5 mb-8 border border-slate-100 group hover:shadow-apple-hover transition-all duration-300 relative">
            
            {/* 文本输入区 */}
            <textarea
              className="w-full bg-transparent border-none p-0 text-[17px] placeholder-slate-300 text-slate-800 font-medium resize-none focus:ring-0 leading-relaxed tracking-wide min-h-[120px]"
              placeholder={`把对方发来的话粘贴在这里，或者写下你的诉求...\n(如果主动发消息，请留空或直接描述意图)`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              autoFocus
            />

            {/* 图片预览区 (如果有图) */}
            {selectedImage && (
              <div className="mt-4 mb-2 relative inline-block animate-[fadeIn_0.3s_ease-out]">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="h-24 w-auto rounded-lg border border-slate-200 shadow-sm"
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-md"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* 底部工具栏 */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedImage 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-slate-100'
                  }`}
                >
                  <ImageIcon size={16} />
                  {selectedImage ? '重新上传' : '上传聊天截图'}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              
              {/* 字数统计或清空 */}
              <span className="text-[10px] font-bold text-slate-300">
                {inputText.length} 字
              </span>
            </div>
          </div>

          {/* 2. 身份与意图 (保持不变) */}
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
                  />
                </div>
              )}
            </div>

            {/* 亲疏程度 */}
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
              <div className="relative h-6 flex items-center">
                <div className="absolute w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-slate-200 to-slate-400" style={{ width: `${relationScore * 10}%` }}></div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={relationScore}
                  onChange={(e) => setRelationScore(Number(e.target.value))}
                  className="w-full h-full opacity-0 cursor-pointer absolute z-10"
                />
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

          {/* 生成按钮 */}
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
                  <span>{statusText}</span>
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
                  contextData={getContextData()} 
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