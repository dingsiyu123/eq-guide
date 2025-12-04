// dingsiyu123/eq-guide/eq-guide-ccc19c578c952b411d06ce5f109ddf0429802660/app/layout.tsx

import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Footer from '../components/Footer';

// Define the GA Tracking ID (Read from environment variables)
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  // 1. 浏览器标签页显示的标题
  title: '人情世故指南 - 中国式高情商社交军师',
  
  // 2. 搜索引擎和分享时的描述
  description: '深谙中国式人情世故的高情商AI军师（点开即玩）',
  
  // 3. 关键词，有助于SEO
  keywords: ['高情商', '人情世故', '话术', '微信回复', '职场社交', '饭局应酬', 'AI助手', '无需注册'],
  
  authors: [{ name: 'Ding Siyu' }],
  
  // 4. 核心配置：微信/朋友圈/Twitter 分享卡片
  openGraph: {
    title: '人情世故指南 - 你的中国式高情商社交救星', // 分享卡片的大标题
    description: '深谙中国式人情世故的高情商AI军师（点开即玩）', // 分享卡片的小字
    url: 'https://www.ask-shiye.com', // 
    siteName: '人情世故指南',
    locale: 'zh_CN',
    type: 'website',
    // images: ['/share-card.png'], // (可选) 如果你有做好的宣传图，放在 public 目录下并在这里填文件名
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* === 【新增】Google Analytics 脚本 === */}
        {GA_TRACKING_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        {/* === 【结束新增】Google Analytics === */}
      </head>
      
      {/* 2. 这里的 body 样式确保页面高度撑满 */}
      <body className="bg-ancient antialiased min-h-screen flex flex-col">
        
        {/* 主内容区域 */}
        <div className="flex-1">
          {children}
        </div>

        {/* 放入全局底部栏 */}
        <Footer />
        
      </body>
    </html>
  );
}