import React, { useState, memo } from 'react';
import { ChevronDown, Copy, Share2, Sparkles, User, X, Loader2 } from 'lucide-react';
import { Plan } from '../types';
import { generatePoster } from '../utils/posterGenerator'; // 引入新的 Generator

interface ResultCardProps {
  plan: Plan;
  type: 'online' | 'offline';
  contextData?: { label: string; value: string }[];
  onRegenerateSingle: (id: string) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ plan, type, contextData = [], onRegenerateSingle }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 海报相关状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let content = "";
    if (type === 'online' && plan.replyText) {
      content = plan.replyText.join('\n');
    } else if (type === 'offline' && plan.steps) {
      content = plan.steps.map(s => `${s.keyword}: ${s.description}`).join('\n');
    }
    navigator.clipboard.writeText(content);
    alert("已复制到剪贴板");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
    
    // 如果已经生成过，就不重新生成了
    if (shareImage) return;

    setIsGenerating(true);
    try {
      // 调用新的 Canvas 生成器
      const imgUrl = await generatePoster(plan, type, contextData);
      setShareImage(imgUrl);
    } catch (error) {
      console.error('海报生成失败:', error);
      alert('生成失败，请重试');
      setShowShareModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const titleMatch = plan.title.match(/(Plan\s*[A-Z0-9]+)[:：]?\s*(.*)/i);
  const planTag = titleMatch ? titleMatch[1].toUpperCase() : null; 
  const mainTitle = titleMatch ? titleMatch[2] : plan.title;

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-apple border border-slate-100 overflow-hidden mb-6 transition-all duration-300 hover:shadow-apple-hover">
        
        {/* 1. 卡片头部 */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-5 py-4 cursor-pointer flex justify-between items-start bg-white/50 backdrop-blur-sm select-none"
        >
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {planTag && (
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wide shadow-sm">
                  {planTag}
                </span>
              )}
              <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-snug">
                {mainTitle}
              </h3>
            </div>

            {!isExpanded && (
              <p className="text-xs text-slate-400 line-clamp-1 animate-[fadeIn_0.3s_ease-out]">
                “{plan.mindset}”
              </p>
            )}
          </div>

          <div className={`text-slate-300 transition-transform duration-300 mt-1 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {/* 2. 展开内容区 */}
        {isExpanded && (
          <div className="px-5 pb-5 animate-[fadeIn_0.2s_ease-out]">
            <div className="h-px w-full bg-slate-100 mb-5"></div>
            <div className="bg-slate-50/80 rounded-xl p-4 mb-6 border-l-[3px] border-cinnabar relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5"><Sparkles size={40} /></div>
              <div className="flex gap-3 items-start relative z-10">
                <Sparkles size={16} className="text-cinnabar mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600 leading-relaxed text-justify font-medium">{plan.mindset}</p>
              </div>
            </div>

            {type === 'online' && (
              <div className="space-y-5 font-sans px-1">
                {plan.originalText && (
                  <div className="flex items-end gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                      <User size={14} />
                    </div>
                    <div className="bg-white border border-slate-100 text-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-none text-[15px] font-medium leading-relaxed max-w-[85%] shadow-sm">
                      {plan.originalText}
                    </div>
                  </div>
                )}
                {plan.replyText?.map((text, idx) => (
                  <div key={idx} className="flex items-end gap-2.5 justify-end">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-4 py-2.5 rounded-2xl rounded-br-none text-[15px] font-medium leading-relaxed max-w-[85%] shadow-md shadow-slate-200">
                      {text}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <span className="text-[10px] font-bold">我</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === 'offline' && (
              <div className="space-y-3">
                {plan.steps?.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xl shadow-inner">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                        <span className="text-slate-300 font-serif text-xs italic">0{idx + 1}</span>
                        {step.keyword}
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed text-justify">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button onClick={handleCopy} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
                <Copy size={16} /> <span>复制锦囊</span>
              </button>
              <button onClick={handleShare} className="px-5 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 全屏分享弹窗 --- */}
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
                  <p className="text-sm font-bold text-slate-600 animate-pulse">正在绘制海报...</p>
                </div>
              ) : (
                shareImage && (
                  <img src={shareImage} alt="Share Poster" className="w-full h-auto block animate-[fadeIn_0.3s_ease-out]" />
                )
              )}
            </div>

            {shareImage && !isGenerating && (
              <p className="text-white/90 text-xs font-bold mt-5 bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-md animate-bounce shadow-lg">
                长按图片保存 · 发给朋友
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(ResultCard);