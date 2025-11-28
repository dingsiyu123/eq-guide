import React from 'react';
import { MessageCircle, Wine, Swords } from 'lucide-react';
import { Page } from '../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-ancient flex flex-col items-center p-8 relative overflow-hidden">
      {/* 装饰边框 */}
      <div className="absolute inset-4 border-4 border-double border-ink opacity-80 pointer-events-none z-10"></div>
      <div className="absolute inset-5 border border-ink opacity-30 pointer-events-none z-10"></div>
      
      {/* 标题区 */}
      <div className="mt-20 mb-16 relative z-20 text-center">
        <div className="w-16 h-24 bg-cinnabar/10 absolute -left-4 -top-4 -z-10 rounded-sm"></div>
        <h1 className="text-6xl font-serif font-black text-ink mb-2 tracking-widest writing-vertical-rl mx-auto leading-tight" style={{ writingMode: 'horizontal-tb' }}>
          人情<br/>世故<br/>指南
        </h1>
        <div className="mt-6 flex justify-center">
          <span className="bg-cinnabar text-paper px-3 py-1 text-sm font-serif tracking-[0.3em] rounded-sm shadow-seal">
            高情商秘籍
          </span>
        </div>
      </div>

      {/* 菜单区 */}
      <div className="w-full max-w-xs space-y-6 z-20">
        
        {/* 线上嘴替 */}
        <button 
          onClick={() => onNavigate(Page.ONLINE)}
          className="w-full bg-paper border-2 border-ink shadow-[4px_4px_0px_#2B2B2B] p-4 flex items-center space-x-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-stone/10"
        >
          <div className="w-12 h-12 border-2 border-ink rounded-full flex items-center justify-center bg-stone-100">
            <MessageCircle size={24} className="text-ink" />
          </div>
          <div className="text-left flex-1">
            <h2 className="text-xl font-bold font-serif text-ink">线上嘴替</h2>
            <p className="text-xs text-stone-600 font-serif">微信回话 · 滴水不漏</p>
          </div>
          <div className="text-cinnabar font-serif opacity-50">壹</div>
        </button>

        {/* 线下救场 */}
        <button 
          onClick={() => onNavigate(Page.OFFLINE)}
          className="w-full bg-paper border-2 border-ink shadow-[4px_4px_0px_#2B2B2B] p-4 flex items-center space-x-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-stone/10"
        >
          <div className="w-12 h-12 border-2 border-ink rounded-full flex items-center justify-center bg-stone-100">
            <Wine size={24} className="text-ink" />
          </div>
          <div className="text-left flex-1">
            <h2 className="text-xl font-bold font-serif text-ink">线下救场</h2>
            <p className="text-xs text-stone-600 font-serif">酒局应酬 · 控场之术</p>
          </div>
          <div className="text-cinnabar font-serif opacity-50">贰</div>
        </button>

        {/* 情商江湖 */}
        <button 
          onClick={() => onNavigate(Page.ARENA)}
          className="w-full bg-ink text-paper border-2 border-ink shadow-[4px_4px_0px_#9A2A2A] p-4 flex items-center justify-center space-x-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-8 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-paper/5 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          <Swords size={20} className="text-cinnabar" />
          <span className="font-serif font-bold text-lg tracking-[0.2em] relative z-10">情商江湖 · 演武场</span>
        </button>
      </div>

      <div className="mt-auto mb-4 text-xs text-stone-400 font-serif tracking-widest opacity-60">
        © 乙巳年 · 赛博出版
      </div>
    </div>
  );
};

export default Home;