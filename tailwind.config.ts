import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './views/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景：改为极简灰白，模拟 iOS 背景
        paper: '#F9FAFB', // 以前是古纸色，现在是极淡的灰
        
        // 文字：改为深灰，不再是纯黑，减少视觉疲劳
        ink: '#111827',   // 接近黑色的深灰
        
        // 品牌色：保留朱砂红的魂，但调得更像“科技红/橙”
        cinnabar: '#E11D48', // Rose-600，一种很现代的红
        
        // 辅助色
        stone: {
          DEFAULT: '#6B7280',
          '100': '#F3F4F6',
          '200': '#E5E7EB',
          '300': '#D1D5DB',
          '500': '#6B7280',
          '900': '#111827'
        },
      },
      fontFamily: {
        // 核心改动：把 serif (宋体) 换成 sans (黑体/无衬线)
        // 只有极少数标题想保留韵味时才用 serif
        serif: ['"Noto Serif SC"', 'SimSun', 'serif'],
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Segoe UI"', 
          'Roboto', 
          '"Helvetica Neue"', 
          'Arial', 
          '"Noto Sans SC"', 
          'sans-serif'
        ],
      },
      boxShadow: {
        // 改为弥散柔光阴影，像 Apple 的卡片
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'apple-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      },
    },
  },
  plugins: [],
};

export default config;