// components/ResultCard.tsx
import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp, Copy, Share2, X } from 'lucide-react';
import { Plan } from '../types';
import { generatePoster } from '../utils/posterGenerator';

interface ResultCardProps {
  plan: Plan;
  type: 'online' | 'offline';
  contextData?: { label: string; value: string }[]; 
  onRegenerateSingle: (id: string) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ plan, type, contextData = [], onRegenerateSingle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let content = "";
    const contextStr = contextData.map(c => `${c.label}: ${c.value}`).join('\n');
    
    if (type === 'online' && plan.replyText) {
      content = `【局势】\n${contextStr}\n\n【师爷锦囊】\n${plan.replyText.join('\n')}\n\n👉 问师爷: ask-shiye.com`;
    } else if (type === 'offline' && plan.steps) {
      content = `【局势】\n${contextStr}\n\n【师爷锦囊】\n${plan.steps.map(s => `${s.keyword}: ${s.description}`).join('\n')}\n\n👉 问师爷: ask-shiye.com`;
    }
    navigator.clipboard.writeText(content);
    alert("锦囊已收入囊中（已复制）");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
    
    if (shareImage) return;

    setGenerating(true);

    try {
      const imageURL = await generatePoster(plan, type, contextData);
      setShareImage(imageURL);
    } catch (error) {
      console.error("海报生成失败", error);
      alert("生成失败，请直接截屏");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div 
        className={`bg-white mb-6 transition-all duration-300 relative border-[1.5px] border-ink shadow-[4px_4px_0px_#2B2B2B] ${
          isExpanded ? 'translate-x-[2px] translate-y-[2px] shadow-none' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 🔥 保留你原来的卡片头部 */}
        <div className="p-5 cursor-pointer relative z-10 bg-paper">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="font-serif font-black text-xl text-ink mb-3 tracking-widest border-b-[1.5px] border-cinnabar/20 inline-block pb-1">
                {plan.title}
              </h3>
              <div className="relative pl-4 border-l-[3px] border-cinnabar">
                <p className="text-sm text-stone-600 font-serif font-bold leading-relaxed text-justify">
                  {plan.mindset}
                </p>
              </div>
            </div>
            <div className="text-ink opacity-50 mt-1">
              {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
        </div>

        {/* 🔥 保留你原来的展开内容（气泡 + 步骤） */}
        {isExpanded && (
          <div className="border-t-[1.5px] border-b-[1.5px] border-dashed border-ink/20 py-6 px-4 animate-[fadeIn_0.3s_ease-out] relative">
            <div className="absolute inset-0 bg-paper/50 pointer-events-none"></div>

            {/* 🎈 线上模式：对话气泡 */}
            {type === 'online' && (
              <div className="space-y-6 relative z-10 font-serif">
                 {/* 🔥 修改点：只有当有原话时，才显示对方气泡 */}
                 {plan.originalText && (
                   <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center text-sm font-black border-[1.5px] border-ink rounded-sm shrink-0 shadow-sm">彼</div>
                      <div className="bg-white text-ink px-4 py-3 rounded-md rounded-tl-none border-[1.5px] border-ink text-sm font-bold leading-relaxed shadow-sm relative max-w-[85%]">
                        <span className="relative z-10">{plan.originalText}</span>
                      </div>
                   </div>
                 )}
                 
                 {plan.replyText?.map((text, idx) => (
                   <div key={idx} className="flex items-start gap-3 justify-end">
                     <div className="bg-[#B5C99A] text-ink px-4 py-3 rounded-md rounded-tr-none border-[1.5px] border-ink text-sm font-bold leading-relaxed shadow-sm relative max-w-[85%] text-left group hover:-translate-y-0.5 transition-transform cursor-default">
                        <span className="relative z-10">{text}</span>
                     </div>
                     <div className="w-10 h-10 bg-cinnabar text-paper flex items-center justify-center text-sm font-black border-[1.5px] border-ink rounded-sm shrink-0 shadow-sm">我</div>
                   </div>
                 ))}
              </div>
            )}

            {/* 📋 线下模式：步骤拆解 */}
            {type === 'offline' && (
               <div className="space-y-6 mt-2 relative z-10 font-serif">
                 {plan.steps?.map((step, idx) => (
                   <div key={idx} className="flex gap-4">
                     <div className="flex-shrink-0 w-12 h-12 border-[1.5px] border-ink flex items-center justify-center text-2xl bg-paper shadow-sm rounded-sm">
                       {step.icon}
                     </div>
                     <div>
                       <h4 className="font-serif font-bold text-lg text-ink">{step.keyword}</h4>
                       <p className="text-sm text-stone-600 leading-relaxed mt-1 font-serif text-justify border-l-[1.5px] border-stone-300 pl-3">
                         {step.description}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {/* 🔥 按钮区 */}
            <div className="mt-8 flex gap-2 relative z-10">
               <button 
                 onClick={handleCopy}
                 className="flex-1 py-3 bg-cinnabar text-paper border-[1.5px] border-ink font-serif font-black tracking-[0.2em] text-lg flex items-center justify-center gap-2 hover:bg-[#8A2525] transition-all shadow-[2px_2px_0px_#2B2B2B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-sm group"
               >
                 <Copy size={18} className="group-active:scale-90 transition-transform" /> 
                 <span>收入囊中</span>
               </button>

               <button 
                 onClick={handleShare}
                 className="w-14 bg-white text-ink border-[1.5px] border-ink flex items-center justify-center hover:bg-stone-100 transition-all shadow-[2px_2px_0px_#2B2B2B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-sm"
                 title="生成海报"
               >
                 <Share2 size={20} />
               </button>
            </div>
          </div>
        )}
      </div>

      {/* 分享弹窗 */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" 
          onClick={() => setShowShareModal(false)}
        >
          <div className="relative w-full max-w-sm flex flex-col items-center" onClick={e => e.stopPropagation()}>
            
            {generating ? (
              <div className="bg-paper border-2 border-ink p-6 rounded-sm flex flex-col items-center gap-3 shadow-lg">
                <div className="w-8 h-8 border-4 border-stone-300 border-t-cinnabar rounded-full animate-spin"></div>
                <p className="text-ink font-serif font-bold animate-pulse">师爷正在研墨...</p>
              </div>
            ) : (
              shareImage && (
                <div className="flex flex-col items-center gap-4 animate-[slideUp_0.3s_ease-out] w-full">
                  <div className="relative shadow-2xl border-4 border-white rounded-sm overflow-hidden">
                    <img src={shareImage} alt="Share Poster" className="w-full h-auto max-h-[70vh] object-contain" />
                  </div>
                  <p className="text-white/80 text-xs font-serif tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                    长按图片保存 · 发给朋友
                  </p>
                  <button 
                    onClick={() => setShowShareModal(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20"
                  >
                    <X size={20} />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(ResultCard);