import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, RefreshCw } from 'lucide-react';
import { Plan } from '../types';

interface ResultCardProps {
  plan: Plan;
  type: 'online' | 'offline';
  onRegenerateSingle: (id: string) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ plan, type, onRegenerateSingle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    let textToCopy = "";
    if (type === 'online' && plan.replyText) {
      textToCopy = plan.replyText.join('\n');
    } else if (type === 'offline' && plan.steps) {
      textToCopy = plan.steps.map(s => `${s.keyword}: ${s.description}`).join('\n');
    }
    navigator.clipboard.writeText(textToCopy);
    alert("锦囊已收录至剪贴板");
  };

  return (
    <div 
      className={`bg-white mb-6 transition-all duration-300 relative border-2 border-ink shadow-[4px_4px_0px_#2B2B2B] ${
        isExpanded ? 'translate-x-[2px] translate-y-[2px] shadow-none' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 头部摘要 */}
      <div className="p-5 cursor-pointer relative z-10 bg-paper">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h3 className="font-serif font-black text-xl text-ink mb-3 tracking-widest border-b-2 border-cinnabar/20 inline-block pb-1">
              {plan.title}
            </h3>
            {/* 心法展示 - 师爷批注风格 */}
            <div className="relative pl-4 border-l-4 border-cinnabar">
              <p className="text-sm text-stone-600 font-serif font-bold leading-relaxed text-justify">
                “{plan.mindset}”
              </p>
            </div>
          </div>
          <div className="text-ink opacity-50 mt-1">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t-2 border-ink/10 bg-[#F5F5F5] p-5 animate-[fadeIn_0.3s_ease-out]">
          
          {/* ONLINE MODE - 仿真微信聊天 */}
          {type === 'online' && (
            <div className="space-y-4">
              
              {/* 对方消息 (左侧) */}
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold border border-stone-300 rounded-sm shrink-0">
                  敌
                </div>
                <div className="bg-white text-ink p-2.5 rounded-sm border border-stone-200 text-sm leading-relaxed shadow-sm relative max-w-[80%]">
                  {/* 小三角 */}
                  <div className="absolute top-3 -left-1.5 w-3 h-3 bg-white border-l border-b border-stone-200 transform rotate-45"></div>
                  <span className="relative z-10">{plan.originalText}</span>
                </div>
              </div>

              {/* 师爷生成的回复 (右侧) - 可能是多条 */}
              {plan.replyText?.map((text, idx) => (
                <div key={idx} className="flex items-start gap-2 justify-end">
                  {/* 气泡颜色修改为：复古茶绿 (#D9E6C3) */}
                  <div className="bg-[#D9E6C3] text-black p-2.5 rounded-sm border border-[#C0D1A6] text-sm leading-relaxed shadow-sm relative max-w-[80%] text-left">
                     {/* 小三角 */}
                     <div className="absolute top-3 -right-1.5 w-3 h-3 bg-[#D9E6C3] border-t border-r border-[#C0D1A6] transform rotate-45"></div>
                     <span className="relative z-10">{text}</span>
                  </div>
                  <div className="w-9 h-9 bg-ink text-paper flex items-center justify-center text-xs font-bold border border-ink rounded-sm shrink-0">
                    我
                  </div>
                </div>
              ))}
              
            </div>
          )}

          {/* OFFLINE MODE */}
          {type === 'offline' && (
             <div className="space-y-6 mt-2">
               {plan.steps?.map((step, idx) => (
                 <div key={idx} className="flex gap-4">
                   <div className="flex-shrink-0 w-12 h-12 border-2 border-ink flex items-center justify-center text-2xl bg-paper shadow-[2px_2px_0px_#000]">
                     {step.icon}
                   </div>
                   <div>
                     <h4 className="font-serif font-bold text-lg text-ink">
                       {step.keyword}
                     </h4>
                     <p className="text-sm text-stone-600 leading-relaxed mt-1 font-serif text-justify border-l-2 border-stone-200 pl-2">
                       {step.description}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          )}

          {/* 操作栏 */}
          <div className="mt-6 pt-4 border-t border-dashed border-stone-300 flex gap-3">
             <button 
               onClick={handleCopy}
               className="flex-1 bg-cinnabar text-white py-3 font-serif font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-red-800 transition-colors shadow-sm active:shadow-none active:translate-y-[1px]"
             >
               <Copy size={16} /> 一键收录
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;