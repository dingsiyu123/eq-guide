import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
// 1. 引入 Footer 组件 (新增这行)
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: '人情世故指南',
  description: '基于AI的线上/线下沟通场景辅助工具，强调中国式人情世故的解决方案。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      {/* 2. 这里的 body 样式确保页面高度撑满 (新增 min-h-screen flex flex-col) */}
      <body className="bg-ancient antialiased min-h-screen flex flex-col">
        
        {/* 主内容区域 (flex-1 让它自动填满剩余空间) */}
        <div className="flex-1">
          {children}
        </div>

        {/* 3. 放入全局底部栏 (新增这行) */}
        <Footer />
        
      </body>
    </html>
  );
}