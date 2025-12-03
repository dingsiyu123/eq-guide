import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plan } from '../types';
import Header from '../components/Header';
import ResultCard from '../components/ResultCard';
import { getAIResponse } from '../services/aiService';
import { Wine, Mic, Handshake, Zap, Edit3, Sparkles, RefreshCw, Plus, ArrowRight } from 'lucide-react';

interface Props {
  onBack: () => void;
  initialParams?: any;
}

// 字段配置定义
interface FieldConfig {
  key: string;
  label: string;
  options?: string[]; 
  multi?: boolean;
  allowCustom?: boolean;
  inputType?: 'select' | 'textarea';
}

// 场景定义
interface SceneDef {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string; // 新增：用于给图标加背景色
}

const OfflineRescue: React.FC<Props> = ({ onBack, initialParams }) => {
  const [step, setStep] = useState<'list' | 'form'>('list');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // 表单状态
  const [formState, setFormState] = useState<Record<string, string | string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null); 
  
  const [supplement, setSupplement] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Plan[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [statusText, setStatusText] = useState('准备中...');
  const lastUpdateRef = useRef<number>(0);

  // --- 场景定义 (增加配色) ---
  const SCENES: SceneDef[] = [
    { id: '酒局', icon: <Wine size={24} />, title: '酒桌应酬', desc: '敬酒 · 挡酒 · 怕失态', color: 'from-orange-400 to-red-500' },
    { id: '发言', icon: <Mic size={24} />, title: '即兴发言', desc: '点名 · 婚礼 · 大脑空白', color: 'from-blue-400 to-indigo-500' },
    { id: '求人', icon: <Handshake size={24} />, title: '求人办事', desc: '开口难 · 怕尴尬 · 送礼', color: 'from-emerald-400 to-teal-500' },
    { id: '尬聊', icon: <Zap size={24} />, title: '破冰尬聊', desc: '聚会 · 电梯 · 沙龙', color: 'from-yellow-400 to-amber-500' },
    { id: '自定义', icon: <Edit3 size={24} />, title: '自定义', desc: '疑难杂症 · 现场急救', color: 'from-slate-700 to-slate-900' }
  ];

  // --- 动态字段生成逻辑 (保持不变) ---
  const currentFields = useMemo<FieldConfig[]>(() => {
    if (!selectedSceneId) return [];
    const commonProps = { allowCustom: true, inputType: 'select' as const };

    switch (selectedSceneId) {
      case '酒局':
        return [
          { 
            key: 'role', label: '我的角色', 
            options: ['主角/C位', '普通陪客', '蹭饭/小透明'], multi: false, ...commonProps
          },
          { 
            key: 'who', label: '在场有谁', 
            options: ['大领导/金主', '亲戚长辈', '同事/平辈', '下属/晚辈'], multi: true, ...commonProps
          },
          { 
            key: 'intent', label: '核心意图', 
            options: ['得体敬酒', '巧妙挡酒', '借故早退', '活跃气氛'], multi: true, ...commonProps
          }
        ];
      case '发言':
        const occasion = formState['role'] as string;
        let audienceOptions = ['领导高管', '全场来宾', '团队成员'];
        if (occasion === '婚礼庆典') audienceOptions = ['新人双方', '长辈亲友', '全场来宾'];
        if (occasion === '公司会议') audienceOptions = ['老板/资方', '跨部门同事', '下属团队'];
        if (occasion === '行业聚会') audienceOptions = ['行业大牛', '潜在客户', '同行'];

        return [
          { 
            key: 'role', label: '发言场合', 
            options: ['公司会议', '婚礼庆典', '行业聚会'], multi: false, ...commonProps
          },
          { 
            key: 'intent', label: '发言类型', 
            options: ['表达观点/建议', '自我介绍', '场景祝辞', '汇报工作'], multi: false, ...commonProps
          },
          { 
            key: 'who', label: '主要听众', 
            options: audienceOptions, multi: true, ...commonProps
          }
        ];
      case '求人':
        return [
          { 
            key: 'role', label: '事情性质', 
            options: ['牵线搭桥', '日常小忙', '需担责/风险'], multi: false, ...commonProps
          },
          { 
            key: 'who', label: '双方关系', 
            options: ['完全陌生/公事公办', '点头之交', '老熟人/私交好', '有把柄/利益绑定'], multi: false, ...commonProps
          },
          { 
            key: 'intent', label: '我的目的', inputType: 'textarea', options: [], multi: false
          }
        ];
      case '尬聊':
        return [
          { 
            key: 'role', label: '当前场景', 
            options: ['社交聚会/饭局', '电梯/密闭空间', '行业沙龙'], multi: false, ...commonProps
          },
          { 
            key: 'who', label: '对方是谁', 
            options: ['大人物/领导', '异性/Crush', '陌生同行', '半生不熟的人'], multi: true, ...commonProps
          },
          { 
            key: 'intent', label: '我的意图', 
            options: ['结识搭讪', '寻找话题', '拉近关系', '表现得体'], multi: true, ...commonProps
          }
        ];
      default: return [];
    }
  }, [selectedSceneId, formState['role']]);

  useEffect(() => {
    if (selectedSceneId === '发言') {
      setFormState(prev => ({ ...prev, who: [] }));
    }
  }, [formState['role'], selectedSceneId]);

  const handleSceneClick = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setStep('form');
    setFormState({});
    setCustomInputs({});
    setSupplement('');
    setResults([]);
    setShowResults(false);
  };

  const handleOptionToggle = (key: string, value: string, multi: boolean) => {
    setFormState(prev => {
      const current = prev[key];
      if (multi) {
        const list = Array.isArray(current) ? [...current] : [];
        if (list.includes(value)) return { ...prev, [key]: list.filter(item => item !== value) };
        return { ...prev, [key]: [...list, value] };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleCustomInputChange = (key: string, val: string) => {
    setCustomInputs(prev => ({ ...prev, [key]: val }));
  };
  
  const handleTextareaChange = (key: string, val: string) => {
      setFormState(prev => ({ ...prev, [key]: val }));
  }

  // 实时流式解析
  const parseOfflineStream = (fullText: string): Plan[] => {
    const rawPlans = fullText.split('===PLAN_START===');
    const parsedPlans: Plan[] = [];

    rawPlans.forEach((block, index) => {
      const cleanBlock = block.trim();
      if (!cleanBlock || !cleanBlock.includes('【标题】')) return;
      
      const titleMatch = cleanBlock.match(/【标题】(.*?)\n/);
      const mindsetMatch = cleanBlock.match(/【心法】(.*?)(?=\n【步骤】|$)/s);
      
      const steps: any[] = [];
      const stepMatches = [...cleanBlock.matchAll(/【步骤】(.*)/g)];
      stepMatches.forEach(m => {
        const line = m[1].trim();
        const parts = line.match(/^\[(.*?)(?:\]|】)\s*(.*?)(?:-|:|：)\s*(.*)/);
        if (parts) {
          steps.push({
            icon: parts[1].trim(),
            keyword: parts[2].trim(),
            description: parts[3].trim()
          });
        }
      });

      if (titleMatch) {
        parsedPlans.push({
          id: `off-stream-${index}`,
          title: titleMatch[1].trim(),
          mindset: mindsetMatch ? mindsetMatch[1].trim().replace(/^["“]|["”]$/g, '') : '师爷正在分析局势...',
          steps: steps
        });
      }
    });
    return parsedPlans;
  };

  const handleGenerate = async () => {
    if (!selectedSceneId) return;
    if (selectedSceneId === '自定义' && !supplement.trim()) {
      alert("请简要描述您的情况");
      return;
    }

    const finalState: Record<string, string> = {};
    currentFields.forEach(field => {
      const val = formState[field.key];
      const customVal = customInputs[field.key];
      let finalVal = '';
      
      if (field.inputType === 'textarea') {
          finalVal = val as string || '';
      } else {
        if (Array.isArray(val)) {
          const list = [...val];
          if (list.includes('自定义') && customVal) {
             const idx = list.indexOf('自定义');
             list[idx] = customVal;
          }
          finalVal = list.join('、');
        } else {
          if (val === '自定义' && customVal) finalVal = customVal;
          else finalVal = val as string || '';
        }
      }
      finalState[field.key] = finalVal;
    });

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setStatusText('正在拆解局势...');
    setShowResults(true);
    setResults([]);
    lastUpdateRef.current = 0;
    let accumulatedText = "";

    try {
        const sceneTitle = SCENES.find(s => s.id === selectedSceneId)?.title || selectedSceneId;
        await getAIResponse('offline', {
            scenario: sceneTitle,
            formState: finalState,
            supplement: supplement
        }, (chunk) => {
            accumulatedText += chunk;
            const now = Date.now();
            if (now - lastUpdateRef.current > 100 || chunk.includes('PLAN_END')) {
                const plans = parseOfflineStream(accumulatedText);
                if (plans.length > 0) setResults(plans);
                lastUpdateRef.current = now;
            }
        }, controller.signal);
    } catch(e: any) {
        if (e.name !== 'AbortError') console.error(e);
    } finally {
        if (abortControllerRef.current === controller) {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }
  };

  const getContextData = () => {
    const data: { label: string; value: string }[] = [];
    currentFields.forEach(field => {
      const val = formState[field.key];
      const displayVal = Array.isArray(val) ? val.join('、') : val;
      const finalVal = (displayVal === '自定义' || (Array.isArray(val) && val.includes('自定义'))) 
          ? (customInputs[field.key] || displayVal) 
          : displayVal;
      if (finalVal) data.push({ label: field.label.replace(' (多选)', ''), value: finalVal as string });
    });
    return data;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-slate-900">
      <Header 
        title={step === 'list' ? "线下救场" : SCENES.find(s => s.id === selectedSceneId)?.title || "锦囊"} 
        onBack={() => {
          if (step === 'form') {
            setStep('list');
            setShowResults(false);
          } else {
            onBack();
          }
        }} 
      />

      <div className="flex-1 max-w-3xl mx-auto w-full p-5 pb-32 overflow-y-auto no-scrollbar">
        
        {/* === STEP 1: 场景选择 (现代化宫格) === */}
        {step === 'list' && (
          <div className="grid grid-cols-2 gap-4 animate-[slideUp_0.2s_ease-out]">
            {SCENES.map((scene) => (
              <button
                key={scene.id}
                onClick={() => handleSceneClick(scene.id)}
                className="group relative bg-white p-5 rounded-2xl shadow-apple border border-slate-100 hover:shadow-apple-hover hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden h-40 flex flex-col justify-between"
              >
                {/* 装饰圆 */}
                <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${scene.color} opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500`}></div>
                
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scene.color} flex items-center justify-center text-white shadow-sm mb-2`}>
                  {scene.icon}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">{scene.title}</h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{scene.desc}</p>
                </div>

                {/* 悬停出现的箭头 */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                  <ArrowRight size={18} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* === STEP 2: 动态表单 (SaaS 配置风格) === */}
        {step === 'form' && selectedSceneId && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            
            <div className={`transition-all duration-500 ${showResults ? 'hidden' : 'block'}`}>
              
              {/* 大卡片容器 */}
              <div className="bg-white rounded-3xl shadow-apple p-6 mb-8 border border-slate-100 space-y-8">
                
                {/* 动态字段 */}
                {currentFields.map((field) => {
                  const currentValue = formState[field.key];
                  const isMulti = field.multi;
                  const isCustomSelected = Array.isArray(currentValue) 
                      ? currentValue.includes('自定义') 
                      : currentValue === '自定义';

                  // 纯文本输入
                  if (field.inputType === 'textarea') {
                      return (
                        <div key={field.key}>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
                            {field.label}
                           </label>
                           <textarea
                              value={(currentValue as string) || ''}
                              onChange={(e) => handleTextareaChange(field.key, e.target.value)}
                              placeholder="请输入您的具体诉求..."
                              className="w-full bg-slate-50 border-none rounded-xl p-4 text-base text-slate-900 font-medium resize-none h-32 focus:ring-1 focus:ring-slate-200 focus:bg-white transition-all placeholder-slate-400"
                           />
                        </div>
                      );
                  }

                  // 选项
                  return (
                    <div key={field.key}>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {field.label}
                        </label>
                        {isMulti && <span className="text-[10px] text-slate-300 font-bold bg-slate-50 px-1.5 py-0.5 rounded">多选</span>}
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                        {field.options?.map((opt) => {
                          const isSelected = Array.isArray(currentValue)
                            ? currentValue.includes(opt)
                            : currentValue === opt;
                            
                          return (
                            <button
                              key={opt}
                              onClick={() => handleOptionToggle(field.key, opt, !!isMulti)}
                              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                                isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.02]' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                        
                        {/* 自定义按钮 */}
                        {field.allowCustom && (
                          <button 
                             onClick={() => handleOptionToggle(field.key, '自定义', !!isMulti)}
                             className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all border flex items-center gap-1 ${
                                isCustomSelected
                                 ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.02]' 
                                 : 'bg-white text-slate-400 border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-600'
                             }`}
                          >
                              <Plus size={14} /> 自定义
                          </button>
                        )}
                      </div>

                      {/* 自定义输入框 */}
                      {isCustomSelected && (
                        <div className="mt-3 animate-[fadeIn_0.2s_ease-out]">
                          <input
                            type="text"
                            value={customInputs[field.key] || ''}
                            onChange={(e) => handleCustomInputChange(field.key, e.target.value)}
                            className="w-full bg-transparent border-b border-slate-200 py-2 px-1 text-slate-900 placeholder-slate-300 text-base font-medium focus:border-slate-900 outline-none transition-colors"
                            placeholder={`请输入${field.label.replace(' (多选)', '')}...`}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 补充信息 */}
                {selectedSceneId !== '自定义' && (
                    <div className="pt-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
                          补充信息 <span className="opacity-50 font-normal normal-case">(可选)</span>
                       </label>
                       <textarea 
                          value={supplement}
                          onChange={(e) => setSupplement(e.target.value)}
                          placeholder="例：我不喝酒 / 只有我一个人..."
                          className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-900 font-medium resize-none h-24 focus:ring-1 focus:ring-slate-200 focus:bg-white transition-all placeholder-slate-400"
                        />
                    </div>
                )}
                
                {selectedSceneId === '自定义' && (
                     <div>
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">
                          您的处境
                       </label>
                       <textarea 
                          value={supplement}
                          onChange={(e) => setSupplement(e.target.value)}
                          placeholder="请详细描述您遇到的难题..."
                          className="w-full bg-slate-50 border-none rounded-xl p-4 text-base text-slate-900 font-medium resize-none h-40 focus:ring-1 focus:ring-slate-200 focus:bg-white transition-all placeholder-slate-400"
                        />
                    </div>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="mt-8">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                    loading 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-black'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      <span>{statusText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="text-yellow-400 fill-current" />
                      <span>拆解局势</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* 结果展示区 */}
            {showResults && (
              <div className="animate-[slideUp_0.4s_ease-out]">
                <div className="flex justify-between items-center mb-6 px-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-cinnabar rounded-full inline-block shadow-sm"></span>
                    锦囊妙计
                  </h2>
                  <button 
                    onClick={handleGenerate} 
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 active:scale-95 transition-all"
                    disabled={loading}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''}/> 
                    <span>换一批</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {results.length === 0 && loading && (
                    <div className="text-center py-20">
                      <div className="inline-block p-4 rounded-full bg-slate-50 mb-4 animate-pulse">
                        <Sparkles size={32} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium text-sm">师爷正在研墨...</p>
                    </div>
                  )}
                  {results.map((plan) => (
                    <div key={plan.id} className="animate-[fadeIn_0.3s_ease-out]">
                      <ResultCard 
                        plan={plan} 
                        type="offline" 
                        contextData={getContextData()}
                        onRegenerateSingle={() => {}} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineRescue;