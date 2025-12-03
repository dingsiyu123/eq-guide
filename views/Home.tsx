import React, { useState } from 'react';
import { MessageCircle, Wine, Swords, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { Page } from '../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    // 背景：浅灰 + 极淡的点阵纹理
    <div className="min-h-screen bg-[#F9FAFB] bg-grid-pattern flex flex-col font-sans text-slate-900">
      
      {/* 1. 顶部导航栏 (模拟 SaaS 官网) */}
      <nav className="w-full px-6 py-5 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          {/* 这里可以是你的 Logo，现在先用文字 */}
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
            师
          </div>
          <span className="font-bold text-lg tracking-tight">人情世故指南</span>
        </div>
        <button 
          onClick={() => alert("联系开发者：dddingsiyu@163.com")}
          className="text-sm font-medium text-slate-500 hover:text-black transition-colors"
        >
          关于我们
        </button>
      </nav>

      {/* 2. Hero 区域：大标题 */}
      <div className="mt-16 mb-12 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-cinnabar text-xs font-bold mb-6 border border-red-100">
          <Sparkles size={12} />
          <span>AI 驱动的社交军师</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          让每一次回应<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">都滴水不漏</span>
        </h1>
        
        <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
          拒绝无效社交，告别尴尬冷场。
          <br className="hidden md:block" />
          基于中国式人情世故的 AI 辅助工具。
        </p>
      </div>

      {/* 3. 功能卡片区 (参考了你发的第二张图) */}
      <div className="w-full max-w-md mx-auto px-6 space-y-4 pb-20">
        
        {/* 卡片 1: 线上嘴替 */}
        <div 
          onClick={() => onNavigate(Page.ONLINE)}
          className="group bg-white p-5 rounded-2xl shadow-apple hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-slate-100 flex items-center gap-5 relative overflow-hidden"
        >
          {/* iOS 风格图标容器 */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
            <MessageCircle size={26} strokeWidth={2} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              线上嘴替
              {/* 这里的“壹”保留一点点中式元素，但做得很小 */}
              <span className="text-[10px] text-slate-300 font-serif border border-slate-200 px-1 rounded">壹</span>
            </h3>
            <p className="text-sm text-slate-500 leading-snug">微信回话神器。针对糊弄、拒绝、夸奖等场景生成高情商回复。</p>
          </div>
          
          {/* 箭头 */}
          <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
            <ArrowRight size={20} />
          </div>
        </div>

        {/* 卡片 2: 线下救场 */}
        <div 
          onClick={() => onNavigate(Page.OFFLINE)}
          className="group bg-white p-5 rounded-2xl shadow-apple hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-slate-100 flex items-center gap-5"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Wine size={26} strokeWidth={2} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              线下救场
              <span className="text-[10px] text-slate-300 font-serif border border-slate-200 px-1 rounded">贰</span>
            </h3>
            <p className="text-sm text-slate-500 leading-snug">饭局、婚礼、电梯闲谈。教你手放哪、眼看哪、话怎么说。</p>
          </div>
          <div className="text-slate-300 group-hover:text-orange-500 transition-colors">
            <ArrowRight size={20} />
          </div>
        </div>

        {/* 卡片 3: 情商江湖 */}
        <div 
          onClick={() => onNavigate(Page.ARENA)}
          className="group bg-white p-5 rounded-2xl shadow-apple hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-slate-100 flex items-center gap-5"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-black rounded-xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Swords size={26} strokeWidth={2} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              情商江湖
              <span className="text-[10px] text-slate-300 font-serif border border-slate-200 px-1 rounded">叁</span>
            </h3>
            <p className="text-sm text-slate-500 leading-snug">实战模拟游戏。扮演职场倒霉蛋，在博弈中学会拒绝与周旋。</p>
          </div>
          <div className="text-slate-300 group-hover:text-black transition-colors">
            <ArrowRight size={20} />
          </div>
        </div>

      </div>

      {/* 底部信任背书 (SaaS 常见设计) */}
      <div className="mt-auto py-8 text-center border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <p className="text-xs font-bold text-slate-400 mb-3 tracking-widest uppercase">Powered By</p>
        <div className="flex justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           {/* 模拟一些 logo，增加靠谱感 */}
           <div className="flex items-center gap-1">
             <Zap size={16} className="text-yellow-500" />
             <span className="font-bold text-slate-700">SiliconFlow</span>
           </div>
           <div className="flex items-center gap-1">
             <Shield size={16} className="text-green-500" />
             <span className="font-bold text-slate-700">DeepSeek</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default Home;