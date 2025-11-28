import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction }) => {
  return (
    <div className="sticky top-0 z-40 bg-paper border-b-4 border-double border-ink h-16 flex items-center justify-between px-4 shadow-sm">
      <button 
        onClick={onBack}
        className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-stone/10 transition-colors text-ink"
      >
        <ArrowLeft size={24} strokeWidth={2} />
      </button>
      
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <h1 className="text-lg font-serif font-black text-ink tracking-[0.2em]">
          {title}
        </h1>
      </div>

      <div className="w-8 flex justify-end">
        {rightAction}
      </div>
    </div>
  );
};

export default Header;