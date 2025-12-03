import QRCode from 'qrcode';

// ===========================================================
// 🎨 配置常量
// ===========================================================
const THEME = {
  bg: '#F8FAFC',
  textMain: '#1E293B',
  textSub: '#64748B',
  textLight: '#94A3B8', // 浅灰，用于免责声明
  accent: '#2563EB',
  accentGradient: ['#3B82F6', '#2563EB'],
  bubbleLeft: '#FFFFFF', // 左侧气泡改为纯白，更干净
  border: '#E2E8F0',
};

const FONT_FAMILY = '"Noto Sans SC", sans-serif';

// ===========================================================
// 🛠️ 预加载
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

  const tags = contextData.filter(c => {
    if (type === 'online' && c.label.includes('原话')) return false;
    if (!c.value || c.value.trim() === '') return false;
    return true;
  });

  // 2. 📏 预计算高度
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  const contentWidth = 750 - 80;
  
  let calculatedHeight = 60; // 顶部 padding

  // A. Header
  calculatedHeight += 90;

  // B. Tags Section
  if (tags.length > 0) {
    tempCtx.font = `22px ${FONT_FAMILY}`;
    const { totalHeight } = measureTagsSection(tempCtx, tags, contentWidth);
    calculatedHeight += totalHeight;
  }

  // C. Strategy Header
  calculatedHeight += 80; 
  
  tempCtx.font = `26px ${FONT_FAMILY}`;
  const mindsetLines = wrapText(tempCtx, plan.mindset, contentWidth - 80);
  const mindsetHeight = mindsetLines.length * 42 + 100;
  calculatedHeight += mindsetHeight + 50; 

  // D. Content Body
  if (type === 'online') {
    tempCtx.font = `bold 26px ${FONT_FAMILY}`;
    
    if (plan.originalText) {
      const lines = wrapText(tempCtx, plan.originalText, contentWidth - 140);
      calculatedHeight += lines.length * 36 + 40 + 30;
    }
    
    if (plan.replyText) {
      plan.replyText.forEach((text: string) => {
        const lines = wrapText(tempCtx, text, contentWidth - 140);
        calculatedHeight += lines.length * 36 + 40 + 25;
      });
    }
  } else {
    tempCtx.font = `22px ${FONT_FAMILY}`;
    plan.steps?.slice(0, 3).forEach((step: any) => {
      const descLines = wrapText(tempCtx, step.description, contentWidth - 100);
      calculatedHeight += Math.max(100, descLines.length * 34 + 60) + 20;
    });
  }

  // E. Footer (高度增加以容纳免责声明)
  calculatedHeight += 260; 

  // 3. 🎨 创建 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = Math.max(1000, calculatedHeight); 

  const ctx = canvas.getContext('2d')!;
  
  // 背景
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const bgGrad = ctx.createLinearGradient(0, 0, 750, 600);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(1, '#F1F5F9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, 600);

  // 4. 绘制流程
  let currentY = 60;

  currentY = drawHeader(ctx, type, currentY);

  if (tags.length > 0) {
    currentY = drawTagsSection(ctx, tags, currentY);
  }

  currentY = drawStrategyHeader(ctx, plan, currentY);

  // 增加一点垂直间距
  currentY += 10; 

  if (type === 'online') {
    currentY = drawChatFlow(ctx, plan, currentY);
  } else {
    currentY = drawStepList(ctx, plan, currentY);
  }

  // Footer 
  const footerY = Math.max(currentY + 60, canvas.height - 220);
  await drawFooter(ctx, footerY);

  return canvas.toDataURL('image/png', 1.0);
}

// ===========================================================
// 🎨 子绘图函数
// ===========================================================

function drawHeader(ctx: CanvasRenderingContext2D, type: string, y: number): number {
  const startX = 40;
  
  drawRoundedRect(ctx, startX, y, 60, 60, 16, THEME.textMain, null, 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 34px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('师', startX + 30, y + 32);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = THEME.textMain;
  ctx.font = `900 34px ${FONT_FAMILY}`;
  ctx.fillText('人情世故指南', startX + 80, y - 2);

  ctx.fillStyle = THEME.textSub;
  ctx.font = 'bold 18px "Arial", sans-serif';
  ctx.fillText('AI Social Strategy Guide', startX + 82, y + 40);

  const tagText = type === 'online' ? '线上嘴替' : '线下救场';
  const tagColor = type === 'online' ? THEME.accent : '#F97316';
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  const tagWidth = ctx.measureText(tagText).width + 30;
  const tagX = 750 - 40 - tagWidth;
  
  drawRoundedRect(ctx, tagX, y + 8, tagWidth, 40, 20, '#FFFFFF', tagColor, 2);
  ctx.fillStyle = tagColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tagX + tagWidth / 2, y + 8 + 22);

  return y + 90;
}

function measureTagsSection(ctx: CanvasRenderingContext2D, tags: any[], contentWidth: number) {
  ctx.font = `22px ${FONT_FAMILY}`;
  const { height: tagsHeight } = layoutTags(ctx, tags, contentWidth - 40, 0, 0, true);
  return { totalHeight: 70 + tagsHeight + 30 };
}

function drawTagsSection(ctx: CanvasRenderingContext2D, tags: any[], y: number): number {
  const startX = 40;
  const contentWidth = 750 - 80;
  
  ctx.font = `22px ${FONT_FAMILY}`;
  const { height: tagsHeight } = layoutTags(ctx, tags, contentWidth - 40, 0, 0, true);
  const containerHeight = 70 + tagsHeight;

  drawRoundedRect(ctx, startX, y, contentWidth, containerHeight, 16, '#FFFFFF', THEME.border, 1);

  ctx.fillStyle = THEME.accent;
  ctx.fillRect(startX + 10, y + 24, 4, 20);
  
  ctx.fillStyle = THEME.textMain;
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('当前局势', startX + 20, y + 20);

  layoutTags(ctx, tags, contentWidth - 40, startX + 20, y + 60, false);

  return y + containerHeight + 30;
}

function drawStrategyHeader(ctx: CanvasRenderingContext2D, plan: any, y: number): number {
  const startX = 40;
  const contentWidth = 750 - 80;

  const titleMatch = plan.title.match(/(Plan\s*[A-Z0-9]+)[:：]?\s*(.*)/i);
  const planTag = titleMatch ? titleMatch[1].toUpperCase() : 'PLAN';
  const mainTitle = titleMatch ? titleMatch[2] : plan.title;

  drawRoundedRect(ctx, startX, y, 90, 32, 16, THEME.textMain, null, 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(planTag, startX + 45, y + 17);

  ctx.fillStyle = THEME.textMain;
  ctx.font = `900 44px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(mainTitle, startX + 105, y - 6);

  y += 60;

  ctx.font = `26px ${FONT_FAMILY}`;
  const mindsetLines = wrapText(ctx, plan.mindset, contentWidth - 80);
  const mindsetHeight = mindsetLines.length * 42 + 100;

  const grad = ctx.createLinearGradient(startX, y, startX + contentWidth, y + mindsetHeight);
  grad.addColorStop(0, '#EFF6FF');
  grad.addColorStop(1, '#DBEAFE');
  
  drawRoundedRect(ctx, startX, y, contentWidth, mindsetHeight, 20, grad, THEME.border, 1);

  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.font = 'bold 80px Georgia';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('"', startX + 15, y + 10);

  ctx.fillStyle = '#1E293B';
  ctx.font = `26px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const textCenterX = startX + contentWidth / 2;
  let mindY = y + 50;

  for (const line of mindsetLines) {
    ctx.fillText(line, textCenterX, mindY);
    mindY += 42;
  }

  return y + mindsetHeight + 40;
}

function drawChatFlow(ctx: CanvasRenderingContext2D, plan: any, y: number): number {
  const contentWidth = 750 - 80;
  ctx.font = `bold 26px ${FONT_FAMILY}`;

  // A. 对方原话（左侧）
  if (plan.originalText) {
    const lines = wrapText(ctx, plan.originalText, contentWidth - 140);
    const h = lines.length * 36 + 40;

    const avatarRadius = 28;
    const avatarY = y + h - 18;

    drawCircle(ctx, 70, avatarY, avatarRadius, null, '#F1F5F9');
    
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TA', 70, avatarY);

    ctx.font = `bold 26px ${FONT_FAMILY}`;
    drawBubble(ctx, 110, y, lines, h, 'left');
    y += h + 30;
  }

  // B. 我方回复（右侧）
  if (plan.replyText) {
    for (const text of plan.replyText) {
      const lines = wrapText(ctx, text, contentWidth - 140);
      const h = lines.length * 36 + 40;
      
      // ⚠️ 修复：计算气泡真实宽度 (文字宽度 + 内边距 60)
      const textWidth = measureTextWidth(ctx, lines);
      const bubbleWidth = textWidth + 60; // 左右各30px padding

      // 头像位置
      const avatarX = 750 - 50; // 头像中心 X 坐标
      const avatarRadius = 28;
      
      // 气泡 X 坐标 = 头像中心 - 头像半径 - 间距(12px) - 气泡宽度
      const bubbleX = avatarX - avatarRadius - 12 - bubbleWidth;

      drawBubble(ctx, bubbleX, y, lines, h, 'right');

      const avatarY = y + h - 18;
      drawCircle(ctx, avatarX, avatarY, avatarRadius, null, THEME.textMain);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 18px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('我', avatarX, avatarY);

      y += h + 25;
    }
  }

  return y;
}

function drawStepList(ctx: CanvasRenderingContext2D, plan: any, y: number): number {
  if (!plan.steps) return y;

  for (let i = 0; i < Math.min(plan.steps.length, 3); i++) {
    const step = plan.steps[i];
    const lines = wrapText(ctx, step.description, 500);
    const h = Math.max(90, lines.length * 34 + 50);

    drawRoundedRect(ctx, 40, y, 670, h, 16, '#FFFFFF', THEME.border, 1);

    drawCircle(ctx, 80, y + 45, 18, null, '#F1F5F9');
    ctx.fillStyle = THEME.textSub;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}`, 80, y + 45);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = THEME.textMain;
    ctx.font = `bold 26px ${FONT_FAMILY}`;
    ctx.fillText(step.keyword, 120, y + 18);

    ctx.fillStyle = THEME.textSub;
    ctx.font = `22px ${FONT_FAMILY}`;
    let lineY = y + 55;
    for (const line of lines) {
      ctx.fillText(line, 120, lineY);
      lineY += 34;
    }

    y += h + 20;
  }
  return y;
}

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

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = THEME.textMain;
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.fillText('遇到社交难题?', 40, y);

  ctx.fillStyle = THEME.textSub;
  ctx.font = `20px ${FONT_FAMILY}`;
  ctx.fillText('扫码获取你的 AI 军师', 40, y + 35);

  try {
    const qrDataURL = await QRCode.toDataURL('https://www.ask-shiye.com', {
      width: 120,
      margin: 1,
      color: { dark: '#0F172A', light: '#00000000' }
    });
    const qrImage = await loadImage(qrDataURL);

    drawRoundedRect(ctx, 750 - 40 - 100, y - 5, 100, 100, 12, '#FFFFFF', THEME.border, 1);
    ctx.drawImage(qrImage, 750 - 40 - 92, y + 3, 84, 84);
  } catch (e) {
    console.error('QR Code render failed');
  }

  // ⚠️ 核心新增：免责声明 (更小号字体，浅灰色)
  y += 120; 
  ctx.fillStyle = THEME.textLight;
  ctx.font = '18px "Noto Sans SC", sans-serif'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('AI大模型生成 仅供娱乐参考', 375, y);
}

// ... 辅助函数保持不变 ...
function layoutTags(ctx: CanvasRenderingContext2D, tags: any[], maxWidth: number, startX: number, startY: number, dryRun: boolean) {
  if (!tags || tags.length === 0) return { height: 0, newY: startY };

  let x = startX;
  let y = startY;
  const lineHeight = 50;

  ctx.font = `22px ${FONT_FAMILY}`;

  tags.forEach(tag => {
    const text = `${tag.label}: ${tag.value}`;
    const width = ctx.measureText(text).width + 30;

    if (x + width > startX + maxWidth) {
      x = startX;
      y += lineHeight + 10;
    }

    if (!dryRun) {
      const isScore = tag.label.includes('分');
      const strokeColor = isScore ? THEME.accent : THEME.border;
      const textColor = isScore ? THEME.accent : THEME.textSub;

      drawRoundedRect(ctx, x, y, width, 40, 20, '#FFFFFF', strokeColor, 1);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText(text, x + 15, y + 20);
    }
    x += width + 12;
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

function measureTextWidth(ctx: CanvasRenderingContext2D, lines: string[]): number {
  let max = 0;
  lines.forEach(l => {
    const w = ctx.measureText(l).width;
    if (w > max) max = w;
  });
  return max;
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
  // ⚠️ 修复：计算气泡真实宽度，移除 min-width 150/200 限制
  const textWidth = measureTextWidth(ctx, lines);
  const w = textWidth + 60; // 左右各30 padding

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
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = `bold 26px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  let textY = y + 20;
  const textX = x + 30;

  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += 36;
  }
}