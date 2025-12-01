import React, { useState } from 'react';
import { MessageCircle, Wine, Swords, Mail } from 'lucide-react';
import { Page } from '../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  // 控制邮箱显示的开关
  const [showEmail, setShowEmail] = useState(false);

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

      {/* 底部注脚区域 (交互式) */}
      <div className="mt-16 mb-8 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-500 z-20">
        <div className="text-[10px] font-serif tracking-[0.2em] text-stone-500 text-center leading-loose">
          <p>乙巳年 · 赛博出版</p>
          
          {/* 点击名字或图标展开邮箱 */}
          <div 
            className="mt-1 flex items-center justify-center gap-2 cursor-pointer group"
            onClick={() => setShowEmail(!showEmail)}
            title="点击查看联系方式"
          >
            <span>
              Designed by{' '}
              <span className={`font-bold border-b transition-all pb-[1px] ${showEmail ? 'text-cinnabar border-cinnabar' : 'text-stone-600 border-stone-400/30 group-hover:text-ink'}`}>
                Ding Siyu
              </span>
            </span>
            <Mail size={12} className={`transition-colors ${showEmail ? 'text-cinnabar' : 'text-stone-400 group-hover:text-ink'}`} />
          </div>

          {/* 邮箱展开区域 */}
          <div className={`overflow-hidden transition-all duration-300 ease-out flex flex-col items-center ${showEmail ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
             <span className="text-cinnabar font-bold select-all bg-white/50 px-2 py-1 rounded-sm border border-cinnabar/20 shadow-sm">
               dddingsiyu@163.com
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;