import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction }) => {
  return (
    <div className="sticky top-0 z-50 w-full h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 transition-all">
      {/* 左侧返回按钮：更轻盈的灰色 */}
      <button 
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
      >
        <ArrowLeft size={22} strokeWidth={2.5} />
      </button>
      
      {/* 中间标题：改为标准无衬线黑体，加粗，深灰 */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-base font-bold text-slate-900">
          {title}
        </h1>
      </div>

      {/* 右侧占位或按钮 */}
      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </div>
  );
};

export default Header;