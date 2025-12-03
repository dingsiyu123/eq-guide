import QRCode from 'qrcode';

// ===========================================================
// 🎨 配置常量：SaaS / 苹果风配色 (微调版)
// ===========================================================
const THEME = {
  bg: '#F8FAFC',        // 整体背景 Slate-50
  cardBg: '#FFFFFF',    // 卡片背景 White
  textMain: '#1E293B',  // 深色文字 Slate-800 (比纯黑更柔和)
  textSub: '#64748B',   // 浅色文字 Slate-500
  accent: '#2563EB',    // 品牌蓝 Blue-600
  accentGradient: ['#3B82F6', '#2563EB'], // 更明亮的蓝色渐变
  bubbleLeft: '#F1F5F9',// 对方气泡 Slate-100
  border: '#E2E8F0',    // 边框 Slate-200
  shadow: 'rgba(148, 163, 184, 0.1)' // 更淡的阴影
};

// ===========================================================
// 🛠️ 预加载逻辑
// ===========================================================
async function loadFonts() {
  const fontName = 'Noto Sans SC';
  try {
    const font = new FontFace(fontName, `url(https://fonts.gstatic.com/s/notosanssc/v26/k3kXo84MPvpLmixcA63OEALhLOCT-xWtmGJ3.woff2)`);
    await font.load();
    document.fonts.add(font);
  } catch (e) {
    console.warn('字体加载失败，使用系统字体', e);
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

  // 1. 过滤数据
  const originalTextItem = contextData.find(c => c.label.includes('原话') || c.label.includes('情境'));
  const tags = contextData.filter(c => !c.label.includes('原话') && !c.label.includes('情境'));

  // 2. 📏 预计算高度
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.font = 'bold 28px "Noto Sans SC", sans-serif';

  const padding = 40;
  const contentWidth = 750 - padding * 2;
  let totalHeight = 220; // 头部高度 (稍微减小)

  // A. 计算标签区域高度 (智能折叠)
  if (tags.length > 0) {
    const { height: tagsHeight } = layoutTags(tempCtx, tags, contentWidth, 0, 0, true);
    totalHeight += tagsHeight + 50; // 加上标题间距
  }

  // B. 计算原话高度
  if (originalTextItem) {
     totalHeight += tags.length > 0 ? 30 : 50; // 根据上面有没有标签调整间距
     // 加上标题 "对方原话" 的高度
     totalHeight += 40; 
     const lines = wrapText(tempCtx, originalTextItem.value, contentWidth - 60);
     totalHeight += lines.length * 36 + 60; // 容器高度
  }

  // C. 计算核心策略 (标题 + 心法)
  totalHeight += 100; // 间距
  const mindsetLines = wrapText(tempCtx, plan.mindset, contentWidth - 60);
  // 心法容器高度 = 行数 * 行高 + 上下内边距 + 装饰高度
  totalHeight += mindsetLines.length * 42 + 80; 

  // D. 计算对话/步骤高度
  totalHeight += 60; // 间距
  if (type === 'online') {
      if (plan.originalText) {
          totalHeight += measureBubbleHeight(tempCtx, plan.originalText, contentWidth) + 30;
      }
      plan.replyText?.forEach((text: string) => {
          totalHeight += measureBubbleHeight(tempCtx, text, contentWidth) + 30;
      });
  } else {
      plan.steps?.slice(0, 3).forEach((step: any) => {
          const descHeight = wrapText(tempCtx, step.description, contentWidth - 100).length * 34;
          totalHeight += Math.max(100, descHeight + 60) + 20;
      });
  }

  totalHeight += 220; // 底部Footer

  // 3. 🎨 创建 Canvas
  const canvas = document.createElement('canvas');
  const scale = 2; 
  canvas.width = 750;
  canvas.height = Math.max(1334, totalHeight);

  const ctx = canvas.getContext('2d')!;
  
  // 填充背景
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 顶部极简光影 (模拟光源)
  const bgGrad = ctx.createLinearGradient(0, 0, 750, 600);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(1, '#F1F5F9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, 600);

  // ==========================================
  // 4. 绘制流程
  // ==========================================
  let currentY = 60;

  currentY = await drawHeader(ctx, type, currentY);
  currentY = await drawContextSection(ctx, tags, originalTextItem, currentY);
  currentY = await drawStrategySection(ctx, plan, type, currentY);
  await drawFooter(ctx, currentY);

  return canvas.toDataURL('image/png', 1.0);
}

// ===========================================================
// 🎨 1. 头部绘制 (更紧凑、Logo优化)
// ===========================================================
async function drawHeader(ctx: CanvasRenderingContext2D, type: string, y: number): Promise<number> {
  const startX = 40;
  
  // 1. Logo "师" (黑底圆角)
  drawRoundedRect(ctx, startX, y, 60, 60, 16, THEME.textMain, null, 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('师', startX + 30, y + 32); 

  // 2. 标题文字
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  ctx.fillStyle = THEME.textMain;
  ctx.font = '900 34px "Noto Sans SC", sans-serif';
  ctx.fillText('人情世故指南', startX + 80, y - 2);

  ctx.fillStyle = THEME.textSub;
  ctx.font = 'bold 18px "Arial", sans-serif';
  ctx.fillText('AI Social Strategy Guide', startX + 82, y + 40);

  // 3. 胶囊标签 (右上角)
  const tagText = type === 'online' ? '线上嘴替' : '线下救场';
  const tagColor = type === 'online' ? THEME.accent : '#F97316'; 
  // 边框风格标签，更显轻盈
  ctx.font = 'bold 22px "Noto Sans SC"';
  const tagWidth = ctx.measureText(tagText).width + 30;
  const tagX = 750 - 40 - tagWidth;
  
  drawRoundedRect(ctx, tagX, y + 8, tagWidth, 40, 20, '#FFFFFF', tagColor, 2);
  ctx.fillStyle = tagColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tagX + tagWidth / 2, y + 8 + 22);

  return y + 90;
}

// ===========================================================
// 🎨 2. 局势卡片 (修复留白问题)
// ===========================================================
async function drawContextSection(ctx: CanvasRenderingContext2D, tags: any[], originalItem: any, y: number): Promise<number> {
  const startX = 40;
  const contentWidth = 750 - 80;

  // 只有当有标签时，才绘制“当前局势”标题和内容
  if (tags.length > 0) {
    // 标题
    ctx.fillStyle = THEME.textSub;
    ctx.font = 'bold 22px "Noto Sans SC"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('当前局势', startX + 15, y);
    
    // 小竖条装饰
    ctx.fillStyle = THEME.textMain;
    ctx.fillRect(startX, y + 4, 4, 18);

    y += 40;

    // 绘制 Tags
    const { newY } = layoutTags(ctx, tags, contentWidth, startX, y, false);
    y = newY + 30; // 增加一点底部间距
  }

  // 绘制原话 (作为独立卡片)
  if (originalItem) {
    const textLines = wrapText(ctx, originalItem.value, contentWidth - 60);
    const boxHeight = textLines.length * 36 + 50;
    
    // 浅色背景卡片
    drawRoundedRect(ctx, startX, y, contentWidth, boxHeight, 20, '#FFFFFF', THEME.border, 1);
    
    // 小标题
    ctx.fillStyle = THEME.textSub;
    ctx.font = 'bold 18px "Noto Sans SC"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('对方原话', startX + 30, y + 25);

    // 内容
    ctx.fillStyle = THEME.textMain;
    ctx.font = '26px "Noto Sans SC"';
    let textY = y + 60;
    for (const line of textLines) {
      ctx.fillText(line, startX + 30, textY);
      textY += 36;
    }
    y += boxHeight + 40;
  }

  return y;
}

// ===========================================================
// 🎨 3. 核心策略 (Plan A + 金句优化)
// ===========================================================
async function drawStrategySection(ctx: CanvasRenderingContext2D, plan: any, type: string, y: number): Promise<number> {
  const startX = 40;
  const contentWidth = 750 - 80;

  // 1. Plan A 胶囊
  const titleMatch = plan.title.match(/(Plan\s*[A-Z0-9]+)[:：]?\s*(.*)/i);
  const planTag = titleMatch ? titleMatch[1].toUpperCase() : 'PLAN A'; 
  const mainTitle = titleMatch ? titleMatch[2] : plan.title;

  drawRoundedRect(ctx, startX, y, 90, 32, 16, THEME.textMain, null, 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(planTag, startX + 45, y + 17);

  // 2. 主标题
  ctx.fillStyle = THEME.textMain;
  ctx.font = '900 44px "Noto Sans SC"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(mainTitle, startX + 105, y - 6);

  y += 50;

  // 3. 心法金句 (长文优化)
  const mindsetLines = wrapText(ctx, plan.mindset, contentWidth - 60);
  const mindsetHeight = mindsetLines.length * 42 + 60;
  
  // 渐变背景条
  const grad = ctx.createLinearGradient(startX, y, startX + contentWidth, y + mindsetHeight);
  grad.addColorStop(0, '#EFF6FF');
  grad.addColorStop(1, '#F8FAFC');
  
  drawRoundedRect(ctx, startX, y, contentWidth, mindsetHeight, 20, grad, null, 0);
  
  // 装饰性引号
  ctx.fillStyle = '#CBD5E1'; // 浅灰引号
  ctx.font = 'bold 60px Arial';
  ctx.fillText('“', startX + 20, y + 40);

  // 文字内容
  ctx.fillStyle = '#334155'; // Slate-700
  ctx.font = '26px "Noto Sans SC"'; // 适中字号
  let mindY = y + 40; // 增加顶部padding
  for (const line of mindsetLines) {
    ctx.fillText(line, startX + 40, mindY); // 增加左侧缩进
    mindY += 42; // 增加行高，提升呼吸感
  }

  y += mindsetHeight + 50;

  // 4. 对话或步骤
  if (type === 'online') {
    y = drawChatFlow(ctx, plan, y);
  } else {
    y = drawStepList(ctx, plan, y);
  }

  return y;
}

// --- 子绘图：对话流 ---
function drawChatFlow(ctx: CanvasRenderingContext2D, plan: any, y: number): number {
  const contentWidth = 750 - 80;
  
  // 对方 (左侧) - 已经被上面"对方原话"卡片覆盖，这里只画我方回复，或者如果还有其他交互
  // 如果 plan.originalText 在上面画过了，这里其实可以略过，或者为了对话完整性再画一次气泡
  // 考虑到海报的信息密度，如果上面有原话卡片，这里只展示“我”的精彩回复可能更好。
  // 但为了保留对话感，我们还是画全，但简化样式。

  if (plan.originalText) {
    const lines = wrapText(ctx, plan.originalText, contentWidth - 140);
    const h = lines.length * 36 + 40;
    
    // 头像 (灰色小人)
    drawCircle(ctx, 80, y + h, 18, THEME.border, '#FFFFFF');
    // 画一个简单的人形icon或者文字
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath(); 
    ctx.arc(80, y + h - 5, 6, 0, Math.PI * 2); // 头
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, y + h + 8, 10, Math.PI, 0); // 身
    ctx.fill();

    // 气泡
    drawBubble(ctx, 110, y, lines, h, 'left');
    y += h + 30;
  }

  // 我 (右侧)
  if (plan.replyText) {
    for (const text of plan.replyText) {
      const lines = wrapText(ctx, text, contentWidth - 140);
      const h = lines.length * 36 + 40;
      const bubbleWidth = measureTextWidth(ctx, lines) + 50;
      
      const bubbleX = 750 - 40 - 40 - bubbleWidth;
      drawBubble(ctx, bubbleX, y, lines, h, 'right');

      // 头像 (黑底白字 "我")
      drawCircle(ctx, 750 - 60, y + h, 18, null, THEME.textMain);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "Noto Sans SC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('我', 750 - 60, y + h);

      y += h + 20;
    }
  }
  return y;
}

// --- 子绘图：步骤列表 ---
function drawStepList(ctx: CanvasRenderingContext2D, plan: any, y: number): number {
  if (!plan.steps) return y;
  
  for (let i = 0; i < Math.min(plan.steps.length, 3); i++) {
    const step = plan.steps[i];
    const lines = wrapText(ctx, step.description, 500);
    const h = Math.max(90, lines.length * 34 + 50);

    drawRoundedRect(ctx, 40, y, 670, h, 16, '#FFFFFF', THEME.border, 1);

    // 序号圆圈
    drawCircle(ctx, 80, y + 45, 18, null, '#F1F5F9');
    ctx.fillStyle = THEME.textSub;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i+1}`, 80, y + 45);

    // 标题
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = THEME.textMain;
    ctx.font = 'bold 26px "Noto Sans SC"';
    ctx.fillText(step.keyword, 120, y + 18);

    // 描述
    ctx.fillStyle = THEME.textSub;
    ctx.font = '22px "Noto Sans SC"';
    let lineY = y + 55;
    for (const line of lines) {
      ctx.fillText(line, 120, lineY);
      lineY += 34;
    }

    y += h + 15;
  }
  return y;
}

// ===========================================================
// 🎨 4. 底部绘制
// ===========================================================
async function drawFooter(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = THEME.border;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(710, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 30;

  // 左侧文字
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = THEME.textMain;
  ctx.font = 'bold 24px "Noto Sans SC"';
  ctx.fillText('遇到社交难题？', 40, y);
  
  ctx.fillStyle = THEME.textSub;
  ctx.font = '20px "Noto Sans SC"';
  ctx.fillText('扫码获取你的 AI 军师', 40, y + 35);

  // 右侧二维码
  try {
    const qrDataURL = await QRCode.toDataURL('https://www.ask-shiye.com', {
        width: 120, margin: 1, color: { dark: '#0F172A', light: '#00000000' }
    });
    const qrImage = await loadImage(qrDataURL);
    // 二维码背景框
    drawRoundedRect(ctx, 750 - 40 - 100, y - 5, 100, 100, 12, '#FFFFFF', THEME.border, 1);
    ctx.drawImage(qrImage, 750 - 40 - 92, y + 3, 84, 84);
  } catch (e) {
    console.error('QR Code render failed');
  }
}

// ===========================================================
// 🛠️ 辅助工具函数 (排版引擎修复版)
// ===========================================================

function layoutTags(ctx: CanvasRenderingContext2D, tags: any[], maxWidth: number, startX: number, startY: number, dryRun: boolean) {
  // 核心修复：如果没有标签，高度为0，不要返回默认行高
  if (!tags || tags.length === 0) {
    return { height: 0, newY: startY };
  }

  let x = startX;
  let y = startY;
  const lineHeight = 50;
  
  ctx.font = '22px "Noto Sans SC"';

  tags.forEach(tag => {
    const text = `${tag.label}: ${tag.value}`;
    const width = ctx.measureText(text).width + 30; 

    // 换行逻辑
    if (x + width > startX + maxWidth) {
      x = startX;
      y += lineHeight + 10;
    }

    if (!dryRun) {
      const isScore = tag.label.includes('分');
      // 胶囊颜色：分数用强调色，其他用默认
      const strokeColor = isScore ? THEME.accent : THEME.border;
      const textColor = isScore ? THEME.accent : THEME.textSub;
      
      drawRoundedRect(ctx, x, y, width, 40, 20, '#FFFFFF', strokeColor, 1);
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText(text, x + 15, y + 20);
    }
    x += width + 12; // 标签间距
  });

  return { height: y - startY + lineHeight, newY: y + lineHeight };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [];
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

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | null | CanvasGradient, stroke: string | null, lw: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stroke: string | null, fill: string | null) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, lines: string[], h: number, type: 'left' | 'right') {
  const w = measureTextWidth(ctx, lines) + 50;
  
  let fillStyle: string | CanvasGradient = THEME.bubbleLeft;
  let textColor = THEME.textMain;
  
  if (type === 'right') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, THEME.accentGradient[0]);
    grad.addColorStop(1, THEME.accentGradient[1]);
    fillStyle = grad;
    textColor = '#FFFFFF';
  }

  ctx.beginPath();
  const r = 18;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - (type === 'right' ? 0 : r));
  if (type === 'right') ctx.lineTo(x + w, y + h); 
  else ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - (type === 'left' ? 0 : r));
  if (type === 'left') ctx.lineTo(x, y + h);
  else ctx.quadraticCurveTo(x, y + h, x, y + h - r);

  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = 'bold 26px "Noto Sans SC"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let textY = y + 20;
  for (const line of lines) {
    ctx.fillText(line, x + 25, textY);
    textY += 36;
  }
}

function measureTextWidth(ctx: CanvasRenderingContext2D, lines: string[]): number {
  let max = 0;
  lines.forEach(l => {
    const w = ctx.measureText(l).width;
    if (w > max) max = w;
  });
  return max;
}

function measureBubbleHeight(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
    const lines = wrapText(ctx, text, maxWidth - 140);
    return lines.length * 36 + 40;
}