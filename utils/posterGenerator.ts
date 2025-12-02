import QRCode from 'qrcode';

// ===========================================================
// 🛠️ 预加载逻辑
// ===========================================================
async function loadFonts() {
  const fontName = 'Noto Serif SC';
  const fontFace = new FontFace(fontName, `url(https://fonts.gstatic.com/s/notoserifsc/v12/nwpPtNmOyqM3IqXyS4oS0a7M7x4.woff2)`);
  try {
    await fontFace.load();
    document.fonts.add(fontFace);
    await document.fonts.ready; 
  } catch (e) {
    console.warn('字体加载失败', e);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ===========================================================
// 🚀 主入口函数
// ===========================================================
export async function generatePoster(
  plan: any,
  type: 'online' | 'offline',
  contextData: { label: string; value: string }[]
): Promise<string> {
  
  await loadFonts();

  // 1. 📏 预计算高度
  const tempCtx = document.createElement('canvas').getContext('2d');
  if (!tempCtx) throw new Error('Canvas init failed');
  
  const totalContentHeight = await calculateTotalHeight(tempCtx, plan, type, contextData);

  // 2. 🎨 创建 Canvas (增加底部缓冲，防遮挡)
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = Math.max(1334, totalContentHeight + 80); 

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器不支持 Canvas');

  // ==========================================
  // 3. 背景绘制
  // ==========================================
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#F2ECDC');   
  gradient.addColorStop(0.5, '#E7E5E4');
  gradient.addColorStop(1, '#F2ECDC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 噪点
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
  for (let i = 0; i < canvas.height * 2; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  // 📜 动态边框
  ctx.strokeStyle = '#2B2B2B';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  // 水印
  ctx.save();
  ctx.fillStyle = 'rgba(43, 43, 43, 0.04)';
  ctx.font = '900 180px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-20 * Math.PI / 180);
  ctx.fillText('人情世故', 0, 0);
  ctx.restore();

  // ==========================================
  // 4. 绘制流程
  // ==========================================
  let currentY = 0;

  currentY = await drawHeader(ctx);
  currentY = await drawContent(ctx, plan, type, contextData, currentY);
  await drawFooter(ctx, currentY);

  return canvas.toDataURL('image/png', 1.0);
}


// ===========================================================
// 📏 高度计算器
// ===========================================================
async function calculateTotalHeight(
    ctx: CanvasRenderingContext2D,
    plan: any,
    type: string,
    contextData: any[]
): Promise<number> {
    let y = 300; 

    // 1. 局势卡片
    const lineHeight = 45;
    const padding = 30;
    const validItems = contextData.filter((i: any) => !i.label.includes('原话') && !i.label.includes('情境'));
    const cardHeight = validItems.length * lineHeight + padding * 2 + 20; 
    y += cardHeight + 50; 

    // 2. 标题区
    y += 60; 

    // 3. 心法区
    ctx.font = 'bold 28px "Noto Serif SC"'; 
    const mindsetLines = wrapText(ctx, plan.mindset, 580);
    const mindsetHeight = mindsetLines.length * 42 + 30;
    y += mindsetHeight + 50;

    // 4. 对话/步骤区
    if (type === 'online') {
        y += 40; 
        const opponentLines = wrapText(ctx, plan.originalText || '...', 480);
        y += opponentLines.length * 38 + 40 + 20; 

        y += 40; 
        const replies = plan.replyText?.slice(0, 2) || [];
        for (const reply of replies) {
             const replyLines = wrapText(ctx, reply, 480);
             y += replyLines.length * 38 + 40 + 20; 
        }
    } else {
        y += 40;
        const steps = plan.steps?.slice(0, 3) || [];
        for (const step of steps) {
             y += 130 + 30; 
        }
    }
    
    // 5. 底部预留高度
    y += 280; 
    
    return y;
}


// ===========================================================
// 🎨 绘制：头部
// ===========================================================
async function drawHeader(ctx: CanvasRenderingContext2D): Promise<number> {
  const startX = 60;
  let y = 120;

  ctx.fillStyle = '#1C1917'; 
  ctx.font = '900 72px "Noto Serif SC", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('人情世故指南', startX, y);

  ctx.fillStyle = '#78716C';
  ctx.font = 'bold 24px "Noto Serif SC", serif'; 
  ctx.fillText('www.ask-shiye.com', startX + 5, y + 95);

  y += 150;
  
  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(690, y);
  ctx.stroke();
  
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, y + 8);
  ctx.lineTo(690, y + 8);
  ctx.stroke();

  return y + 60; 
}


// ===========================================================
// 🎨 绘制：中间内容
// ===========================================================
async function drawContent(
  ctx: CanvasRenderingContext2D,
  plan: any,
  type: 'online' | 'offline',
  contextData: any[],
  startY: number
): Promise<number> {
  let y = startY;
  const contentWidth = 630;
  const startX = 60;

  // --- A. 局势卡片 (虚线框 + 透明底) ---
  const lineHeight = 45;
  const padding = 30;
  const validItems = contextData.filter((i: any) => !i.label.includes('原话') && !i.label.includes('情境'));
  const cardHeight = validItems.length * lineHeight + padding * 2 + 20;

  ctx.save();
  ctx.setLineDash([8, 6]); 
  drawRoundedRect(ctx, startX, y, contentWidth, cardHeight, 10, null, '#78716C', 2);
  ctx.restore();

  // 标签
  const tagWidth = 140;
  const tagHeight = 40;
  drawRoundedRect(ctx, startX - 5, y - 15, tagWidth, tagHeight, 4, '#44403C', null, 0);
  
  ctx.fillStyle = '#F5F5F4';
  ctx.font = 'bold 22px "Noto Serif SC"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('当前局势', startX - 5 + tagWidth / 2, y - 15 + tagHeight / 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#44403C'; 
  
  let textY = y + padding + 25;
  for (const item of validItems) {
    ctx.font = 'bold 26px "Noto Serif SC"';
    ctx.fillText(`${item.label}：`, startX + padding, textY);
    
    const labelWidth = ctx.measureText(`${item.label}：`).width;
    ctx.font = '26px "Noto Serif SC"';
    ctx.fillText(item.value, startX + padding + labelWidth, textY);
    textY += lineHeight;
  }
  y += cardHeight + 50;

  // --- B. 标题 ---
  const prefix = type === 'online' ? '线上嘴替' : '线下救场';
  const cleanTitle = plan.title.replace(/Plan [A-Z][:：]?\s*/i, ''); 
  
  ctx.fillStyle = '#9A2A2A'; 
  ctx.font = '900 38px "Noto Serif SC"';
  ctx.textBaseline = 'top';
  ctx.fillText(`${prefix} · ${cleanTitle}`, startX, y);
  y += 60;

  // --- C. 师爷心法 (正常粗体，非斜体) ---
  const mindsetWidth = contentWidth;
  ctx.font = 'bold 28px "Noto Serif SC"'; 
  const mindsetLines = wrapText(ctx, plan.mindset, mindsetWidth - 50);
  const mindsetHeight = mindsetLines.length * 42 + 30;

  drawRoundedRect(ctx, startX, y, mindsetWidth, mindsetHeight, 8, '#FDFBF7', '#E7E5E4', 2);
  
  ctx.fillStyle = '#9A2A2A';
  ctx.fillRect(startX + 10, y + 15, 6, mindsetHeight - 30);

  ctx.fillStyle = '#44403C';
  let mindsetY = y + 15 + 21; 
  ctx.textBaseline = 'middle';
  
  for (const line of mindsetLines) {
    ctx.fillText(line, startX + 35, mindsetY);
    mindsetY += 42;
  }
  y += mindsetHeight + 50;

  // --- D. 具体回复 ---
  if (type === 'online') {
    y = await drawChatBubbles(ctx, plan, y);
  } else {
    y = await drawActionSteps(ctx, plan, y);
  }

  return y;
}


// ===========================================================
// 💬 聊天气泡
// ===========================================================
async function drawChatBubbles(ctx: CanvasRenderingContext2D, plan: any, startY: number): Promise<number> {
    let y = startY;
  
    // 1. 判断是否有原话 (用于区分是被动回击还是主动出击)
    const hasOriginalText = plan.originalText && plan.originalText.trim().length > 0;
  
    // 2. 如果有原话，绘制左侧“对方攻势”
    if (hasOriginalText) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#78716C'; 
      ctx.font = 'bold 24px "Noto Serif SC"';
      ctx.textBaseline = 'top';
      ctx.fillText('对方攻势', 80, y);
      y += 35;
  
      // 绘制对方气泡
      y = drawSingleBubble(ctx, plan.originalText, y, 'left');
  
      y += 40; // 增加间距
    }
  
    // 3. 右侧：根据情况动态改变标题
    ctx.textAlign = 'right'; 
    ctx.fillStyle = '#9A2A2A';
    
    // 🔥 核心修改：如果有原话叫“师爷回击”，没原话叫“主动出击”
    const rightTitle = hasOriginalText ? '师爷回击' : '主动出击';
    ctx.fillText(rightTitle, 670, y);
    
    y += 35;
  
    // 4. 绘制我方回复气泡
    const replies = plan.replyText?.slice(0, 2) || [];
    for (const reply of replies) {
       y = drawSingleBubble(ctx, reply, y, 'right');
       y += 20; 
    }
  
    return y;
  }

function drawSingleBubble(
    ctx: CanvasRenderingContext2D, 
    text: string, 
    y: number, 
    side: 'left' | 'right'
): number {
    const maxWidth = 480;
    const padding = 25;
    const lineHeight = 38;
    const fontSize = 26;

    ctx.font = `bold ${fontSize}px "Noto Serif SC"`;
    const lines = wrapText(ctx, text, maxWidth - padding * 2);
    const bubbleHeight = lines.length * lineHeight + padding * 2;
    
    let bubbleX;
    let bgColor;
    let strokeColor = '#A8A29E'; 
    let textColor = '#2B2B2B';

    if (side === 'left') {
        bubbleX = 80;
        bgColor = '#FFFFFF';
    } else {
        bubbleX = 670 - maxWidth;
        bgColor = '#B5C99A'; 
        strokeColor = '#57534E';
    }

    let actualBubbleWidth = maxWidth;
    if (lines.length === 1) {
        const width = ctx.measureText(text).width + padding * 3;
        if (width < maxWidth) {
            actualBubbleWidth = width;
            if (side === 'right') bubbleX = 670 - actualBubbleWidth;
        }
    }

    drawRoundedRect(ctx, bubbleX, y, actualBubbleWidth, bubbleHeight, 12, bgColor, strokeColor, 1);

    ctx.fillStyle = textColor;
    ctx.textAlign = 'left'; 
    ctx.textBaseline = 'middle';
    
    let textY = y + padding + lineHeight / 2 - 2;
    for (const line of lines) {
        ctx.fillText(line, bubbleX + padding, textY);
        textY += lineHeight;
    }

    return y + bubbleHeight;
}

// ===========================================================
// 📋 线下步骤 (🟢 改动：去Emoji，改用古风数字)
// ===========================================================
async function drawActionSteps(ctx: CanvasRenderingContext2D, plan: any, startY: number): Promise<number> {
  let y = startY;
  
  ctx.textAlign = 'left';
  ctx.fillStyle = '#78716C';
  ctx.font = 'bold 24px "Noto Serif SC"';
  ctx.textBaseline = 'top';
  ctx.fillText('📋 行动方案', 60, y);
  y += 40;

  const steps = plan.steps?.slice(0, 3) || [];
  const cnNums = ['壹', '贰', '叁', '肆']; // 映射表

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const cardHeight = 130;
    
    // 背景卡片
    drawRoundedRect(ctx, 80, y, 610, cardHeight, 10, '#FFFFFF', '#A8A29E', 2);

    // 🔴 1. 绘制古风印章圆底
    const circleX = 125;
    const circleY = y + 65; // 垂直居中于卡片
    
    ctx.beginPath();
    ctx.arc(circleX, circleY, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#9A2A2A'; // 赭石红
    ctx.fill();

    // ⚪️ 2. 绘制白色数字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 稍微上移 2px 以视觉居中
    ctx.fillText(cnNums[i] || (i + 1).toString(), circleX, circleY - 2);

    // 📝 3. 绘制文字内容 (向右偏移以避开印章)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // 标题
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 30px "Noto Serif SC"';
    ctx.fillText(step.keyword, 175, y + 25);

    // 描述
    ctx.fillStyle = '#57534E';
    ctx.font = '22px "Noto Serif SC"';
    const descLines = wrapText(ctx, step.description, 480);
    
    let descY = y + 70;
    for (const line of descLines.slice(0, 2)) {
      ctx.fillText(line, 175, descY);
      descY += 30;
    }

    y += cardHeight + 30;
  }
  return y;
}

// ===========================================================
// 🎨 绘制：底部 Footer
// ===========================================================
async function drawFooter(ctx: CanvasRenderingContext2D, currentY: number) {
  const footerY = currentY + 50;

  // 1. 分割线
  ctx.strokeStyle = '#2B2B2B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, footerY);
  ctx.lineTo(690, footerY);
  ctx.stroke();

  // 2. 文字
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 32px "Noto Serif SC"';
  ctx.textBaseline = 'top';
  ctx.fillText('问师爷', 60, footerY + 40);

  ctx.fillStyle = '#57534E';
  ctx.font = '22px "Noto Serif SC"';
  ctx.fillText('AI 高情商回复助手', 60, footerY + 85);
  ctx.fillText('线上嘴替 · 线下救场', 60, footerY + 120);

  // 🔥 新增：免责声明 (画在最下面，字号更小，颜色更浅)
  ctx.fillStyle = '#A8A29E'; // 浅灰色
  ctx.font = '18px "Noto Serif SC"';
  ctx.fillText(' 本回复由 AI 大模型生成，仅供娱乐', 30, footerY + 155);


  // 3. 二维码
  try {
    const qrDataURL = await QRCode.toDataURL('https://www.ask-shiye.com', {
        width: 140, margin: 1, color: { dark: '#2B2B2B', light: '#00000000' }
    });
    const qrImage = await loadImage(qrDataURL);
    ctx.drawImage(qrImage, 550, footerY + 30, 140, 140);
  } catch (e) {
    console.error('QR Code render failed');
  }
}

// ===========================================================
// 🛠️ 辅助函数
// ===========================================================
function drawRoundedRect(
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, width: number, height: number, radius: number,
    fillColor: string | null, 
    strokeColor: string | null, 
    lineWidth: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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