// dingsiyu123/eq-guide/eq-guide-ccc19c578c952b411d06ce5f109ddf0429802660/components/Footer.tsx

'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ShieldAlert } from 'lucide-react';

const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 占位高度，防止内容被遮挡 */}
      <div className="h-16"></div>

      {/* Footer 主体 */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out font-sans
        ${isOpen ? 'bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]' : 'bg-transparent pointer-events-none'}`}
      >
        
        {/* === 常驻触发器 (悬浮胶囊) === */}
        {/* pointer-events-auto 确保即使父容器穿透，按钮也能点 */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-auto">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all shadow-sm border
              ${isOpen 
                ? 'bg-slate-100 text-slate-500 border-slate-200 translate-y-[40px] opacity-0' // 展开时隐藏按钮
                : 'bg-white/80 backdrop-blur-md text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
              }`}
          >
            <ShieldAlert size={12} />
            <span>免责声明 & 隐私</span>
            <ChevronUp size={12} />
          </button>
        </div>

        {/* === 展开后的内容 === */}
        {isOpen && (
          <div className="relative w-full max-w-2xl mx-auto flex flex-col h-auto max-h-[70vh]">
            
            {/* 顶部关闭栏 */}
            <div 
              onClick={() => setIsOpen(false)}
              className="flex justify-center items-center py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
            </div>

            {/* 滚动内容区 */}
            <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
              <h3 className="text-sm font-bold text-slate-900 mb-4">免责声明与隐私政策</h3>
              
              <div className="text-xs text-slate-500 space-y-4 leading-relaxed text-justify">
                <p>
                  <span className="font-bold text-slate-700">1. 服务性质：</span>
                  本产品（“问师爷”）提供的所有回复均由人工智能大模型实时生成。这些内容仅供娱乐、参考和辅助社交决策，<strong className="text-rose-500">不构成任何法律、心理咨询、医疗或投资建议</strong>。在做出重大现实决策前，请务必咨询相关领域的专业人士。
                </p>

                <p>
                  <span className="font-bold text-slate-700">2. 数据隐私承诺：</span>
                  我们高度重视您的隐私。
                  <strong className="text-slate-700">本站承诺不收集、不存储、不分享您的任何个人身份信息。</strong>
                  您的聊天记录仅在本地及大模型推理过程中短暂存在，不会被用于任何商业用途或建立用户画像。请勿在对话中输入您的真实姓名、身份证号、银行卡号等敏感私密信息。
                </p>

                <p>
                  <span className="font-bold text-slate-700">3. 内容准确性：</span>
                  AI 模型可能会产生错误、虚假或带有偏见的信息（即“幻觉”）。请用户在使用时结合实际情况独立判断，切勿完全依赖 AI 的生成结果。对于因采纳 AI 建议而产生的任何后果（包括但不限于社交关系破裂、经济损失等），开发者不承担法律责任。
                </p>
                
                <p>
                  <span className="font-bold text-slate-700">4. 合规使用：</span>
                  严禁使用本工具生成涉及色情、暴力、政治敏感、歧视或违反法律法规的内容。一经发现，我们将采取限制访问等措施。
                </p>

                <div className="pt-6 mt-4 border-t border-dashed border-slate-200 text-center opacity-60">
                  <p className="text-[10px] tracking-wider uppercase font-bold text-slate-400">
                    Powered by SiliconFlow · Hosted on Vercel
                  </p>
                  <p className="text-[10px] text-slate-300 mt-1">
                    © {new Date().getFullYear()} EQ Guide. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Footer;