'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';

const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 占位高度 */}
      <div className="h-8"></div>

      {/* Footer 主体 */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out font-serif
        ${isOpen ? 'bg-paper shadow-[0_-8px_30px_rgba(0,0,0,0.08)]' : 'bg-transparent'}`}
      >
        
        {/* === 常驻栏 === */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex justify-center items-center py-3 cursor-pointer group ${isOpen ? 'border-b border-dashed border-stone-300/50' : 'hover:translate-y-[-2px] transition-transform'}`}
        >
          {/* 小胶囊按钮 */}
          <div className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full transition-colors 
            ${isOpen ? 'text-stone-600 bg-stone-100' : 'bg-paper/90 text-stone-400 border border-stone-200 shadow-sm group-hover:text-ink group-hover:border-ink/30'}`}
          >
            <AlertCircle size={14} />
            <span>免责声明 & 隐私政策</span>
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </div>

        {/* === 展开后的内容 === */}
        {isOpen && (
          <div className="px-6 pb-12 pt-6 animate-[fadeIn_0.2s_ease-out] overflow-y-auto max-h-[60vh]">
            <div className="text-xs sm:text-sm leading-loose text-stone-600 space-y-4 text-justify max-w-2xl mx-auto font-medium">
              
              <p>
                <span className="font-bold text-ink">1. 关于服务：</span>
                本产品提供的所有回复均由人工智能大模型生成，仅供娱乐和参考，
                <strong className="text-cinnabar/80 ml-1">不构成任何法律、医疗、心理咨询或投资建议</strong>。
                遇到专业问题请咨询相关领域的专业人士。
              </p>

              <p>
                <span className="font-bold text-ink">2. 数据隐私：</span>
                我们深知隐私的重要性。
                <strong className="text-ink ml-1">本站承诺不收集、不存储您的任何个人身份信息。</strong>
                您的聊天记录仅用于实时生成回复，不会被用于任何商业用途或后台留存。请勿在对话中输入您的身份证号、银行卡号等敏感私密信息。
              </p>

              <p>
                <span className="font-bold text-ink">3. 准确性声明：</span>
                AI 可能会产生错误、虚假或带有偏见的信息（幻觉），请用户在使用时结合实际情况独立判断，切勿完全依赖 AI 的生成结果。
              </p>

              <p>
                <span className="font-bold text-ink">4. 责任豁免：</span>
                用户在现实生活中采纳 AI 建议所产生的任何后果（包括但不限于人际关系破裂、经济损失等），开发者不承担法律责任。
              </p>
              
              <p>
                <span className="font-bold text-ink">5. 合规使用：</span>
                严禁使用本工具生成涉及色情、暴力、政治敏感等违法违规内容。
              </p>

              {/* 底部版权小字 */}
              <p className="pt-4 opacity-40 text-center text-[10px] tracking-widest border-t border-dashed border-stone-300 mt-4">
                Powered by SiliconFlow · Hosted on Vercel
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Footer;