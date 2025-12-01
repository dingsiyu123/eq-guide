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
      // 1. 移除 overflow-hidden，防止截图库误裁切
      // 2. 增加 box-border 确保边框计算在内
      className="w-[375px] bg-[#F2ECDC] text-[#2B2B2B] p-6 relative border-8 border-double border-[#2B2B2B] box-border"
      style={{ fontFamily: '"Noto Serif SC", "SimSun", serif' }}
    >
      {/* --- 1. 顶部：大标题 + 网址 --- */}
      <div className="border-b-[1.5px] border-[#2B2B2B] pb-3 mb-4 flex justify-between items-end">
        <div>
          {/* 修复：leading-normal 防止标题被削头 */}
          <h1 className="text-2xl font-black text-[#9A2A2A] tracking-widest leading-normal mb-1">
            人情世故指南
          </h1>
          <div className="text-[10px] text-[#57534E] tracking-[0.1em] font-bold">
            www.ask-shiye.com
          </div>
        </div>
        {/* 标签 */}
        <div className="bg-[#2B2B2B] text-[#F2ECDC] text-[10px] px-2 py-1 font-bold rounded-sm mb-1">
          {type === 'online' ? '线上嘴替' : '线下救场'}
        </div>
      </div>

      {/* --- 2. 局势区 --- */}
      <div className="bg-[#E7E5E4]/40 p-3 rounded-sm border border-dashed border-[#A8A29E] mb-5">
        {/* 修复：items-center 替代 items-baseline，防止图标和文字高度不一致导致的切断 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-3 bg-[#9A2A2A]"></div>
          {/* 修复：leading-relaxed 增加行高 */}
          <span className="text-xs font-bold text-[#57534E] leading-relaxed pt-[1px]">当前局势</span>
        </div>
        
        {/* 参数网格 */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-2 mb-2">
          {otherContexts.map((item, idx) => (
            // 修复核心点：不要用 items-baseline，改用 items-center
            // baseline 会让不同字体的汉字跟英文数字对齐时出现高度偏移，导致上方被切
            <div key={idx} className="flex items-center text-[11px]">
              <span className="text-[#78716C] shrink-0 leading-normal">{item.label}：</span>
              <span className="text-[#2B2B2B] font-bold truncate leading-normal pt-[1px]">{item.value}</span>
            </div>
          ))}
        </div>

        {originalTextItem && (
          <div className="border-t border-[#D6D3D1] pt-2 mt-1 text-[11px] leading-relaxed flex items-start">
             <span className="text-[#78716C] mr-1 shrink-0">原话/情境：</span>
             <span className="text-[#2B2B2B] font-bold">“{originalTextItem.value}”</span>
          </div>
        )}
      </div>

      {/* --- 3. 核心策略 --- */}
      <div className="mb-6">
        <div className="mb-3 pl-1">
          {/* 修复：leading-relaxed 确保大标题完整 */}
          <h2 className="text-lg font-black text-[#2B2B2B] mb-2 tracking-wide leading-relaxed">
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
                <div className="w-8 h-8 bg-[#2B2B2B] text-[#F2ECDC] flex items-center justify-center text-xs font-bold border-[1.5px] border-[#2B2B2B] rounded-sm shrink-0">
                  彼
                </div>
                {/* 修复：leading-5 给文字足够的空间，items-center 确保文字垂直居中 */}
                <div className="bg-white text-[#2B2B2B] px-3 py-2 rounded-md rounded-tl-none border-[1.5px] border-[#2B2B2B] text-xs font-bold leading-5 shadow-[2px_2px_0px_rgba(0,0,0,0.05)] max-w-[85%] mt-0.5">
                  {originalTextItem?.value || "..."}
                </div>
              </div>

              {/* 我 (右) */}
              {plan.replyText?.slice(0, 2).map((text, i) => (
                <div key={i} className="flex items-start gap-2 justify-end">
                  <div className="bg-[#B5C99A] text-[#2B2B2B] px-3 py-2 rounded-md rounded-tr-none border-[1.5px] border-[#2B2B2B] text-xs font-bold leading-5 shadow-[2px_2px_0px_rgba(43,43,43,1)] max-w-[85%] text-left mt-0.5">
                    {text}
                  </div>
                  <div className="w-8 h-8 bg-[#9A2A2A] text-[#F2ECDC] flex items-center justify-center text-xs font-bold border-[1.5px] border-[#2B2B2B] rounded-sm shrink-0">
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
          
          {/* 
             【重点修复】AI 标签对齐问题 
             1. 使用 flex items-center 强制垂直居中，不再依赖 baseline
             2. 移除了 leading-tight 等可能切断文字的属性
          */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-[#2B2B2B] tracking-widest">问师爷</span>
            {/* AI 标签：固定高度，flex 居中内容 */}
            <span className="flex items-center justify-center h-[16px] px-1.5 bg-[#2B2B2B] text-white text-[9px] font-normal rounded-full">
              AI
            </span>
          </div>

          <p className="text-[10px] text-[#57534E] leading-relaxed text-justify">
            中国人情世故指南<br/>
            线上嘴替 · 线下救场 · 情商游戏 
          </p>
          <div className="text-[10px] text-[#9A2A2A] font-bold mt-2 flex items-center gap-1">
            <span>👉</span>
            <span className="pt-[1px]">长按扫码，破解你的社交死局</span>
          </div>
        </div>
        
        {/* 二维码区域 */}
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