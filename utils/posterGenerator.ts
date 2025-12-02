// utils/posterGenerator.ts

export async function generatePoster(
    plan: any,
    type: 'online' | 'offline',
    contextData: { label: string; value: string }[]
  ): Promise<string> {
    
    const canvas = document.createElement('canvas');
    canvas.width = 750;   // 2倍大小，更清晰
    canvas.height = 1334;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('浏览器不支持 Canvas');
    
    // 🎨 古风渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#F2ECDC');
    gradient.addColorStop(0.5, '#E7E5E4');
    gradient.addColorStop(1, '#F2ECDC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 🖼️ 古风纹理（噪点）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // 📜 外边框（双线）
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    
    // 🎭 大水印（背景）
    ctx.save();
    ctx.fillStyle = 'rgba(43, 43, 43, 0.03)';
    ctx.font = 'bold 180px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-20 * Math.PI / 180);
    await document.fonts.load('900 180px "Noto Serif SC"');
    ctx.fillText('人情世故', 0, 0);
    ctx.restore();
    
    // 📍 绘制内容
    await drawHeader(ctx);
    await drawContent(ctx, plan, type, contextData);
    await drawFooter(ctx);
    
    return canvas.toDataURL('image/png', 0.9);
  }
  
  
  // ========================================
  // 📍 绘制顶部
  // ========================================
  async function drawHeader(ctx: CanvasRenderingContext2D) {
    await document.fonts.load('900 48px "Noto Serif SC"');
    
    // 标题
    ctx.fillStyle = '#9A2A2A';
    ctx.font = 'bold 48px "Noto Serif SC"';
    ctx.textAlign = 'left';
    ctx.fillText('人情世故指南', 60, 100);
    
    // 小标签
    ctx.fillStyle = '#2B2B2B';
    ctx.fillRect(60, 120, 10, 30);
    
    ctx.fillStyle = '#57534E';
    ctx.font = 'bold 20px "Noto Serif SC"';
    ctx.fillText('www.ask-shiye.com', 80, 142);
    
    // 分割线
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 170);
    ctx.lineTo(690, 170);
    ctx.stroke();
  }
  
  
  // ========================================
  // 📍 绘制主内容
  // ========================================
  async function drawContent(
    ctx: CanvasRenderingContext2D,
    plan: any,
    type: 'online' | 'offline',
    contextData: { label: string; value: string }[]
  ) {
    let y = 220;
    
    // 🏷️ "当前局势" 标题
    ctx.fillStyle = '#2B2B2B';
    ctx.font = 'bold 28px "Noto Serif SC"';
    ctx.fillText('当前局势', 60, y);
    y += 50;
    
    // 📋 局势信息（卡片样式）
    ctx.fillStyle = '#FFF';
    ctx.fillRect(60, y - 25, 630, contextData.length * 40 + 20);
    ctx.strokeStyle = '#D6D3D1';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, y - 25, 630, contextData.length * 40 + 20);
    
    ctx.fillStyle = '#57534E';
    ctx.font = 'bold 22px "Noto Serif SC"';
    for (const item of contextData) {
      if (item.label.includes('原话') || item.label.includes('情境')) continue;
      const text = `${item.label}: ${item.value}`;
      ctx.fillText(text, 80, y);
      y += 40;
    }
    
    y += 60;
    
    // 🎯 "师爷锦囊" 标题
    ctx.fillStyle = '#9A2A2A';
    ctx.font = 'bold 32px "Noto Serif SC"';
    ctx.fillText(plan.title, 60, y);
    y += 50;
    
    // 💡 心法（带装饰）
    ctx.strokeStyle = '#9A2A2A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, y - 10);
    ctx.lineTo(80, y - 10);
    ctx.stroke();
    
    ctx.fillStyle = '#9A2A2A';
    ctx.font = 'italic bold 24px "Noto Serif SC"';
    const mindsetLines = wrapText(ctx, `"${plan.mindset}"`, 630);
    for (const line of mindsetLines) {
      ctx.fillText(line, 90, y);
      y += 36;
    }
    
    ctx.strokeStyle = '#9A2A2A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(660, y - 46);
    ctx.lineTo(690, y - 46);
    ctx.stroke();
    
    y += 40;
    
    // 🗨️ 具体内容
    if (type === 'online') {
      await drawOnlineContentV2(ctx, plan, y);
    } else {
      await drawOfflineContentV2(ctx, plan, y);
    }
  }
  
  
  // ========================================
  // 🗨️ 线上内容（对话样式）
  // ========================================
  async function drawOnlineContentV2(
    ctx: CanvasRenderingContext2D,
    plan: any,
    startY: number
  ) {
    let y = startY;
    
    // 对方消息
    ctx.fillStyle = '#78716C';
    ctx.font = 'bold 24px "Noto Serif SC"';
    ctx.fillText('💬 对方说:', 60, y);
    y += 40;
    
    // 白色气泡
    const originalLines = wrapText(ctx, plan.originalText || '...', 550);
    const bubbleHeight = originalLines.length * 32 + 30;
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(80, y - 20, 590, bubbleHeight);
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, y - 20, 590, bubbleHeight);
    
    ctx.fillStyle = '#2B2B2B';
    ctx.font = '22px "Noto Serif SC"';
    for (const line of originalLines) {
      ctx.fillText(line, 100, y);
      y += 32;
    }
    
    y += 50;
    
    // 师爷建议
    ctx.fillStyle = '#9A2A2A';
    ctx.font = 'bold 24px "Noto Serif SC"';
    ctx.fillText('✅ 师爷建议回复:', 60, y);
    y += 40;
    
    // 绿色气泡（最多2条）
    const replies = plan.replyText?.slice(0, 2) || [];
    for (const reply of replies) {
      const replyLines = wrapText(ctx, reply, 550);
      const replyHeight = replyLines.length * 32 + 30;
      
      ctx.fillStyle = '#B5C99A';
      ctx.fillRect(80, y - 20, 590, replyHeight);
      ctx.strokeStyle = '#2B2B2B';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, y - 20, 590, replyHeight);
      
      ctx.fillStyle = '#2B2B2B';
      ctx.font = 'bold 22px "Noto Serif SC"';
      for (const line of replyLines) {
        ctx.fillText(line, 100, y);
        y += 32;
      }
      
      y += 50;
    }
  }
  
  
  // ========================================
  // 📋 线下内容（步骤样式）
  // ========================================
  async function drawOfflineContentV2(
    ctx: CanvasRenderingContext2D,
    plan: any,
    startY: number
  ) {
    let y = startY;
    
    ctx.fillStyle = '#78716C';
    ctx.font = 'bold 24px "Noto Serif SC"';
    ctx.fillText('📋 行动方案:', 60, y);
    y += 50;
    
    const steps = plan.steps?.slice(0, 3) || [];
    for (const step of steps) {
      // 卡片背景
      ctx.fillStyle = '#FFF';
      ctx.fillRect(80, y - 25, 610, 120);
      ctx.strokeStyle = '#D6D3D1';
      ctx.lineWidth = 2;
      ctx.strokeRect(80, y - 25, 610, 120);
      
      // Icon
      ctx.font = '40px Arial';
      ctx.fillText(step.icon, 100, y + 10);
      
      // 关键词
      ctx.fillStyle = '#2B2B2B';
      ctx.font = 'bold 28px "Noto Serif SC"';
      ctx.fillText(step.keyword, 160, y + 10);
      
      // 描述
      ctx.fillStyle = '#57534E';
      ctx.font = '20px "Noto Serif SC"';
      const descLines = wrapText(ctx, step.description, 500);
      for (const line of descLines.slice(0, 2)) {
        y += 35;
        ctx.fillText(line, 160, y + 10);
      }
      
      y += 80;
    }
  }
  
  
  // ========================================
  // 📍 绘制底部
  // ========================================
  async function drawFooter(ctx: CanvasRenderingContext2D) {
    const footerY = 1150;
    
    // 分割线
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, footerY);
    ctx.lineTo(690, footerY);
    ctx.stroke();
    
    // 左侧文字
    ctx.fillStyle = '#2B2B2B';
    ctx.font = 'bold 28px "Noto Serif SC"';
    ctx.textAlign = 'left';
    ctx.fillText('问师爷', 60, footerY + 50);
    
    ctx.fillStyle = '#57534E';
    ctx.font = '20px "Noto Serif SC"';
    ctx.fillText('AI 高情商回复助手', 60, footerY + 80);
    ctx.fillText('线上嘴替 · 线下救场 · 情商竞技', 60, footerY + 110);
    
    // 右侧二维码
    const QRCode = (await import('qrcode')).default;
    const qrDataURL = await QRCode.toDataURL('https://www.ask-shiye.com', {
      width: 160,
      margin: 2,
      color: {
        dark: '#2B2B2B',
        light: '#F2ECDC'
      }
    });
    
    const qrImage = await loadImage(qrDataURL);
    ctx.drawImage(qrImage, 530, footerY + 20, 160, 160);
    
    // 扫码提示
    ctx.fillStyle = '#9A2A2A';
    ctx.font = 'bold 18px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.fillText('扫码体验', 610, footerY + 200);
  }
  
  
  // ========================================
  // 🛠️ 工具函数
  // ========================================
  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const chars = text.split('');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const char of chars) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }
  
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }