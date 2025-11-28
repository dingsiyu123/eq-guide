import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

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
      <body className="bg-stone-900 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}