'use client';

import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plan } from '../types';

interface SharePosterProps {
  plan: Plan;
  contextData: { label: string; value: string }[];
  type: 'online' | 'offline';
}

const SharePoster = forwardRef<HTMLDivElement, SharePosterProps>(({ plan, contextData, type }, ref) => {
  
  const originalTextItem = contextData.find(c => c.label.includes('原话') || c.label.includes('情境'));
  const otherContexts = contextData.filter(c => !c.label.includes('原话') && !c.label.includes('情境'));

  return (
    <div 
      ref={ref} 
      // 底部内边距保持 pb-16，防止底部被切
      className="w-[375px] bg-[#F2ECDC] text-[#2B2B2B] p-6 pb-16 relative border-8 border-double border-[#2B2B2B] box-border"
      style={{ fontFamily: '"Noto Serif SC", "SimSun", serif' }}
    >
      {/* --- 1. 顶部：大标题 + 网址 --- */}
      <div className="border-b-[1.5px] border-[#2B2B2B] pb-3 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-[#9A2A2A] tracking-widest leading-tight mb-1">
            人情世故指南
          </h1>
          <div className="text-[10px] text-[#57534E] tracking-[0.1em] font-bold">
            www.ask-shiye.com
          </div>
        </div>
        <div className="bg-[#2B2B2B] text-[#F2ECDC] text-[10px] px-2 py-1 font-bold rounded-sm mb-1">
          {type === 'online' ? '线上嘴替' : '线下救场'}
        </div>
      </div>

      {/* --- 2. 局势区 --- */}
      <div className="bg-[#E7E5E4]/40 p-3 rounded-sm border border-dashed border-[#A8A29E] mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-3 bg-[#9A2A2A]"></div>
          <span className="text-xs font-bold text-[#57534E]">当前局势</span>
        </div>
        
        {/* 参数网格 */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-2 mb-2">
          {otherContexts.map((item, idx) => (
            <div key={idx} className="flex items-start text-[11px]">
              <span className="text-[#78716C] shrink-0 leading-normal">{item.label}：</span>
              <span className="text-[#2B2B2B] font-bold leading-normal">{item.value}</span>
            </div>
          ))}
        </div>

        {originalTextItem && (
          <div className="border-t border-[#D6D3D1] pt-2 mt-1 text-[11px] flex items-start">
             <span className="text-[#78716C] mr-1 shrink-0 leading-normal">原话/情境：</span>
             <span className="text-[#2B2B2B] font-bold leading-normal">{originalTextItem.value}</span>
          </div>
        )}
      </div>

      {/* --- 3. 核心策略 --- */}
      <div className="mb-6">
        <div className="mb-3 pl-1">
          <h2 className="text-lg font-black text-[#2B2B2B] mb-2 tracking-wide leading-tight">
            {plan.title}
          </h2>
          <div className="text-xs text-[#57534E] border-l-[3px] border-[#9A2A2A] pl-2 leading-relaxed text-justify py-0.5">
            “{plan.mindset}”
          </div>
        </div>

        {/* 内容渲染区 */}
        <div className="bg-white/60 border-[1.5px] border-[#2B2B2B] p-4 rounded-sm shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
          
          {/* ONLINE 模式 */}
          {type === 'online' && (
            <div className="space-y-4">
              {/* 彼 (左) */}
               <div className="flex items-start gap-2">
                {/* 🔥 修复重点 1：彼/我 方块
                   改回 flex 布局，但增加 pb-[3px]。
                   原理：底部垫高3像素，把中间的内容强行往上挤，解决视觉偏下。
                */}
                <div className="w-8 h-8 bg-[#2B2B2B] text-[#F2ECDC] flex items-center justify-center text-xs font-black border-[1.5px] border-[#2B2B2B] rounded-sm shrink-0 pb-[3px]">
                  彼
                </div>
                
                {/* 🔥 修复重点 2：气泡文字
                   使用 flex 居中，并增加 pb-[2px] 微微上移文字。
                */}
                <div className="bg-white text-[#2B2B2B] px-3 py-2 rounded-md rounded-tl-none border-[1.5px] border-[#2B2B2B] text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.05)] max-w-[85%] mt-0.5 min-h-[34px] flex items-center pb-[2px]">
                  <span className="leading-snug">{originalTextItem?.value || "..."}</span>
                </div>
              </div>

              {/* 我 (右) */}
              {plan.replyText?.slice(0, 2).map((text, i) => (
                <div key={i} className="flex items-start gap-2 justify-end">
                  {/* 气泡同样加 pb-[2px] 上移 */}
                  <div className="bg-[#B5C99A] text-[#2B2B2B] px-3 py-2 rounded-md rounded-tr-none border-[1.5px] border-[#2B2B2B] text-xs font-bold shadow-[2px_2px_0px_rgba(43,43,43,1)] max-w-[85%] text-left mt-0.5 min-h-[34px] flex items-center pb-[2px]">
                    <span className="leading-snug">{text}</span>
                  </div>
                  {/* 方块同样加 pb-[3px] 上移 */}
                  <div className="w-8 h-8 bg-[#9A2A2A] text-[#F2ECDC] flex items-center justify-center text-xs font-black border-[1.5px] border-[#2B2B2B] rounded-sm shrink-0 pb-[3px]">
                    我
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OFFLINE 模式 */}
          {type === 'offline' && (
            <div className="space-y-3">
              {plan.steps?.slice(0, 3).map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-base bg-[#F2ECDC] w-8 h-8 flex items-center justify-center border-[1.5px] border-[#2B2B2B] shrink-0 rounded-sm shadow-[2px_2px_0px_#000]">
                    {step.icon}
                  </span>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-xs font-black text-[#2B2B2B] mb-0.5 leading-normal">{step.keyword}</div>
                    <div className="text-[10px] text-[#57534E] leading-relaxed text-justify border-l-[1.5px] border-[#D6D3D1] pl-2">
                      {step.description.length > 45 ? step.description.substring(0, 45) + '...' : step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- 4. 底部介绍 + 二维码 --- */}
      <div className="flex items-center justify-between border-t-[1.5px] border-dashed border-[#A8A29E] pt-4 mt-auto">
      <div className="flex-1 pr-4">
          
          {/* 顶部标题：问师爷 + AI标签 */}
          <div className="flex items-center gap-2 mb-1 h-5">
            <span className="text-sm font-black text-[#2B2B2B] tracking-widest">问师爷</span>
            <span className="flex items-center justify-center h-[16px] px-1.5 bg-[#2B2B2B] text-white text-[9px] font-normal rounded-full pb-[2px]">
              AI
            </span>
          </div>

          {/* 产品介绍 */}
          <p className="text-[10px] text-[#57534E] leading-relaxed text-justify">
            中国人情世故指南<br/>
            线上嘴替 · 线下救场 · 情商游戏 
          </p>

          {/* 🔥 免责声明 (插在这里) */}
          <div className="mt-2 pt-2 border-t border-dashed border-[#D6D3D1]/60">
             <p className="text-[8px] text-[#A8A29E] leading-tight scale-90 origin-left transform">
               * 本回复由 AI 大模型生成，仅供娱乐与参考。<br/>
             </p>
          </div>

          {/* 扫码引导 */}
          <div className="text-[10px] text-[#9A2A2A] font-bold mt-2 flex items-center gap-1">
            <span>👉</span>
            <span className="pt-[1px]">长按扫码，破解你的社交死局</span>
          </div>
        </div>
        
        <div className="bg-white p-1.5 border-[1.5px] border-[#2B2B2B] shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
          <QRCodeSVG value="https://www.ask-shiye.com" size={70} fgColor="#2B2B2B" />
        </div>
      </div>

      {/* 背景水印 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] font-black text-[#2B2B2B] opacity-[0.015] rotate-[-15deg] pointer-events-none z-0 select-none">
        人情世故
      </div>
    </div>
  );
});

SharePoster.displayName = 'SharePoster';

export default SharePoster;