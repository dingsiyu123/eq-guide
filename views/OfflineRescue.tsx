
import React, { useState, useEffect, useMemo } from 'react';
import { Plan } from '../types';
import Header from '../components/Header';
import ResultCard from '../components/ResultCard';
import { getAIResponse } from '../services/aiService';
import { Wine, Mic, Handshake, Zap, Edit3, Feather, RefreshCw, Plus } from 'lucide-react';

interface Props {
  onBack: () => void;
  // Fix: Add initialParams to accept navigation parameters passed from App.tsx
  initialParams?: any;
}

// 字段配置定义
interface FieldConfig {
  key: string;
  label: string;
  options?: string[]; // 文本输入模式下无选项
  multi?: boolean;      // 是否多选
  allowCustom?: boolean; // 是否允许自定义(选项模式下)
  inputType?: 'select' | 'textarea'; // 输入类型
}

// 场景定义
interface SceneDef {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const OfflineRescue: React.FC<Props> = ({ onBack, initialParams }) => {
  const [step, setStep] = useState<'list' | 'form'>('list');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // 表单状态：值可以是字符串(单选)或字符串数组(多选)
  const [formState, setFormState] = useState<Record<string, string | string[]>>({});
  // 专门存储各字段的自定义输入值 map: { fieldKey: customValue }
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  
  const [supplement, setSupplement] = useState(''); // 补充信息
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Plan[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [statusText, setStatusText] = useState('准备中...');

  // --- 场景定义 ---
  const SCENES: SceneDef[] = [
    { id: '酒局', icon: <Wine size={24} strokeWidth={1.5} />, title: '酒桌应酬', desc: '敬酒 · 挡酒 · 怕失态' },
    { id: '发言', icon: <Mic size={24} strokeWidth={1.5} />, title: '即兴发言', desc: '点名 · 婚礼 · 大脑空白' },
    { id: '求人', icon: <Handshake size={24} strokeWidth={1.5} />, title: '求人办事', desc: '开口难 · 怕尴尬 · 送礼' },
    { id: '尬聊', icon: <Zap size={24} strokeWidth={1.5} />, title: '破冰尬聊', desc: '聚会 · 电梯 · 沙龙' },
    { id: '自定义', icon: <Edit3 size={24} strokeWidth={1.5} />, title: '自定义', desc: '疑难杂症 · 现场急救' }
  ];

  // --- 动态字段生成逻辑 ---
  const currentFields = useMemo<FieldConfig[]>(() => {
    if (!selectedSceneId) return [];

    const commonProps = { allowCustom: true, inputType: 'select' as const };

    switch (selectedSceneId) {
      case '酒局':
        return [
          { 
            key: 'role', 
            label: '我的角色', 
            options: ['主角/C位', '普通陪客', '蹭饭/小透明'],
            multi: false,
            ...commonProps
          },
          { 
            key: 'who', 
            label: '在场有谁 (多选)', 
            options: ['大领导/金主', '亲戚长辈', '同事/平辈', '下属/晚辈'], 
            multi: true,
            ...commonProps
          },
          { 
            key: 'intent', 
            label: '核心意图 (多选)', 
            options: ['得体敬酒', '巧妙挡酒', '借故早退', '活跃气氛'],
            multi: true,
            ...commonProps
          }
        ];

      case '发言':
        // 获取当前选中的场合，用于联动
        const occasion = formState['role'] as string; // 复用 role 字段存场合
        
        let audienceOptions = ['领导高管', '全场来宾', '团队成员'];
        if (occasion === '婚礼庆典') audienceOptions = ['新人双方', '长辈亲友', '全场来宾'];
        if (occasion === '公司会议') audienceOptions = ['老板/资方', '跨部门同事', '下属团队'];
        if (occasion === '行业聚会') audienceOptions = ['行业大牛', '潜在客户', '同行'];

        return [
          { 
            key: 'role', 
            label: '发言场合', 
            options: ['公司会议', '婚礼庆典', '行业聚会'],
            multi: false,
            ...commonProps
          },
          { 
            key: 'intent', // 复用 intent 存发言类型
            label: '发言类型', 
            options: ['表达观点/建议', '自我介绍', '场景祝辞', '汇报工作'],
            multi: false,
            ...commonProps
          },
          { 
            key: 'who', 
            label: '主要听众 (多选)', 
            options: audienceOptions,
            multi: true, // 听众可能混杂
            ...commonProps
          }
        ];

      case '求人':
        return [
          { 
            key: 'role', 
            label: '事情性质', 
            options: ['牵线搭桥', '日常小忙', '需担责/风险'],
            multi: false,
            ...commonProps
          },
          { 
            key: 'who', 
            label: '双方关系', 
            options: ['完全陌生/公事公办', '点头之交', '老熟人/私交好', '有把柄/利益绑定'],
            multi: false,
            ...commonProps
          },
          { 
            key: 'intent', 
            label: '我的目的', 
            inputType: 'textarea', // 纯输入框
            options: [],
            multi: false
          }
        ];

      case '尬聊':
        return [
          { 
            key: 'role', 
            label: '当前场景', 
            options: ['社交聚会/饭局', '电梯/密闭空间', '行业沙龙'],
            multi: false,
            ...commonProps
          },
          { 
            key: 'who', 
            label: '对方是谁 (多选)', 
            options: ['大人物/领导', '异性/Crush', '陌生同行', '半生不熟的人'],
            multi: true,
            ...commonProps
          },
          { 
            key: 'intent', 
            label: '我的意图 (多选)', 
            options: ['结识搭讪', '寻找话题', '拉近关系', '表现得体'],
            multi: true,
            ...commonProps
          }
        ];

      default:
        return [];
    }
  }, [selectedSceneId, formState['role']]); // 当场景或第一个字段变化时，重新计算字段

  // 监听联动逻辑：当“发言场合”改变时，清空“听众”
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
        // 多选逻辑
        const list = Array.isArray(current) ? [...current] : [];
        if (list.includes(value)) {
          return { ...prev, [key]: list.filter(item => item !== value) };
        } else {
          return { ...prev, [key]: [...list, value] };
        }
      } else {
        // 单选逻辑
        return { ...prev, [key]: value };
      }
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
    // 按照 Start Tag 分割
    const rawPlans = fullText.split('===PLAN_START===');
    const parsedPlans: Plan[] = [];

    rawPlans.forEach((block, index) => {
      // 1. 基础清理
      const cleanBlock = block.trim();
      // 如果没有【标题】，说明是脏数据或开头的废话，直接丢弃，解决 Plan 0 幽灵卡片问题
      if (!cleanBlock || !cleanBlock.includes('【标题】')) return;
      
      const titleMatch = cleanBlock.match(/【标题】(.*?)\n/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // 心法解析：支持多行，直到遇到【步骤】或结束
      const mindsetMatch = cleanBlock.match(/【心法】(.*?)(?=\n【步骤】|$)/s);
      const mindset = mindsetMatch 
        ? mindsetMatch[1].trim().replace(/^["“]|["”]$/g, '') 
        : '';

      const steps: any[] = [];
      const stepMatches = [...cleanBlock.matchAll(/【步骤】(.*)/g)];
      
      stepMatches.forEach(m => {
        const line = m[1].trim();
        // 增强正则：允许 [Icon] 内部有空格，分隔符支持 - : ： 
        // 示例： [ 👀 ] 观察 - 内容
        const parts = line.match(/^\[(.*?)(?:\]|】)\s*(.*?)(?:-|:|：)\s*(.*)/);
        if (parts) {
          steps.push({
            icon: parts[1].trim(),
            keyword: parts[2].trim(),
            description: parts[3].trim()
          });
        }
      });

      // 只有当有标题时才显示，避免显示不完整的块
      if (title) {
        parsedPlans.push({
          id: `off-stream-${index}`,
          title: title,
          mindset: mindset || '师爷正在分析局势...',
          steps: steps
        });
      }
    });

    return parsedPlans;
  };

  const handleGenerate = async () => {
    
    if (!selectedSceneId) return;
    
    // 自定义场景特殊处理
    if (selectedSceneId === '自定义' && !supplement.trim()) {
      alert("请简要描述您的情况");
      return;
    }

    // 合并表单数据和自定义输入
    const finalState: Record<string, string> = {};
    
    // 遍历当前显示的字段
    currentFields.forEach(field => {
      const val = formState[field.key];
      const customVal = customInputs[field.key];
      
      let finalVal = '';
      
      if (field.inputType === 'textarea') {
          // 直接使用 textarea 的值
          finalVal = val as string || '';
      } else {
        if (Array.isArray(val)) {
          // 多选
          const list = [...val];
          // 如果选中了自定义，把输入框的内容加进去
          if (list.includes('自定义') && customVal) {
             const idx = list.indexOf('自定义');
             list[idx] = customVal;
          }
          finalVal = list.join('、');
        } else {
          // 单选
          if (val === '自定义' && customVal) {
            finalVal = customVal;
          } else {
            finalVal = val as string || '';
          }
        }
      }
      finalState[field.key] = finalVal;
    });

    setLoading(true);
    setStatusText('正在起卦...');
    setShowResults(true);
    setResults([]);
    
    let accumulatedText = "";
    try {
        const sceneTitle = SCENES.find(s => s.id === selectedSceneId)?.title || selectedSceneId;
        
        await getAIResponse('offline', {
            scenario: sceneTitle,
            formState: finalState,
            supplement: supplement
        }, (chunk) => {
            accumulatedText += chunk;
            const plans = parseOfflineStream(accumulatedText);
            // 只有解析出有效 plan 才更新状态
            if (plans.length > 0) {
                setResults(plans);
                setStatusText('师爷正在书写...');
            }
        });
    } catch(e) {
        console.error(e);
        alert("请稍后再试");
    } finally {
        setLoading(false);
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
          
      if (finalVal) {
        // 去掉 label 里的 "(多选)" 后缀，显示更干净
        data.push({ label: field.label.replace(' (多选)', ''), value: finalVal as string });
      }
    });
    return data;
  };

  const getOptionClass = (isSelected: boolean) => {
    if (isSelected) {
      return 'bg-cinnabar text-white border-cinnabar shadow-[3px_3px_0px_#2B2B2B]';
    }
    return 'bg-transparent text-stone-600 border-stone-400 hover:border-ink hover:text-ink';
  };

  return (
    <div className="min-h-screen flex flex-col bg-ancient animate-[fadeIn_0.5s_ease-out] font-serif text-ink">
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

      <div className="flex-1 p-5 pb-20 overflow-y-auto no-scrollbar">
        
        {/* STEP 1: 场景选择 (双列宫格) */}
        {step === 'list' && (
          <div className="grid grid-cols-2 gap-4 animate-[slideUp_0.3s_ease-out]">
            {SCENES.map((scene) => (
              <button
                key={scene.id}
                onClick={() => handleSceneClick(scene.id)}
                className="bg-paper border-2 border-ink shadow-[4px_4px_0px_#2B2B2B] aspect-[4/3] flex flex-col items-center justify-center p-3 gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-stone-100 group relative overflow-hidden"
              >
                <div className="absolute -right-2 -bottom-2 text-6xl font-black text-ink opacity-5 font-serif pointer-events-none group-hover:scale-110 transition-transform">
                  {scene.title.slice(0,1)}
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center bg-white group-hover:bg-cinnabar group-hover:text-white transition-colors">
                  {scene.icon}
                </div>
                <div className="text-center w-full">
                  <h3 className="text-lg font-black tracking-widest text-ink mb-0.5 whitespace-nowrap">{scene.title}</h3>
                  <p className="text-[10px] text-stone-500 font-bold truncate px-1">{scene.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: 动态表单 (抓药模式) */}
        {step === 'form' && selectedSceneId && (
          <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
            
            <div className={`transition-all duration-500 ${showResults ? 'hidden' : 'block'}`}>
              
              <div className="flex items-center gap-3 text-ink opacity-60 mb-6">
                  <Feather size={16} />
                  <span className="text-sm font-bold tracking-widest border-b border-ink/30 pb-1">
                      请勾选当前局势，师爷为您定制对策
                  </span>
              </div>

              {/* 动态字段渲染 */}
              <div className="space-y-8">
                {currentFields.map((field) => {
                  const currentValue = formState[field.key];
                  const isMulti = field.multi;
                  const isCustomSelected = Array.isArray(currentValue) 
                      ? currentValue.includes('自定义') 
                      : currentValue === '自定义';

                  // 如果是纯文本输入模式
                  if (field.inputType === 'textarea') {
                      return (
                        <div key={field.key} className="space-y-4">
                           <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
                            <span className="w-1 h-6 bg-ink inline-block"></span>
                            {field.label}
                           </label>
                           <textarea
                              value={(currentValue as string) || ''}
                              onChange={(e) => handleTextareaChange(field.key, e.target.value)}
                              placeholder="请输入您的具体诉求（如：孩子上学、想借五万块...）"
                              className="w-full bg-transparent border-b-2 border-stone-300 p-2 text-base outline-none focus:border-ink transition-colors placeholder-stone-400 text-ink font-bold resize-none h-24"
                           />
                        </div>
                      );
                  }

                  // 默认选项模式
                  return (
                    <div key={field.key} className="space-y-4">
                      <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
                        <span className="w-1 h-6 bg-ink inline-block"></span>
                        {field.label}
                        {isMulti && <span className="text-xs font-normal opacity-50 text-stone-500">(可多选)</span>}
                      </label>
                      
                      <div className="flex flex-wrap gap-3">
                        {field.options?.map((opt) => {
                          const isSelected = Array.isArray(currentValue)
                            ? currentValue.includes(opt)
                            : currentValue === opt;
                            
                          return (
                            <button
                              key={opt}
                              onClick={() => handleOptionToggle(field.key, opt, !!isMulti)}
                              className={`px-4 py-2.5 text-sm font-bold border-2 transition-all duration-200 ${getOptionClass(isSelected)}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                        
                        {/* 自定义按钮：浅色虚线加号风格 */}
                        {field.allowCustom && (
                          <button 
                             onClick={() => handleOptionToggle(field.key, '自定义', !!isMulti)}
                             className={`px-4 py-2.5 text-sm font-bold border-2 border-dashed transition-all duration-200 flex items-center gap-1 ${
                                isCustomSelected
                                 ? 'bg-cinnabar text-white border-cinnabar border-solid shadow-[3px_3px_0px_#2B2B2B]'
                                 : 'bg-transparent text-stone-400 border-stone-300 hover:border-stone-500 hover:text-stone-600'
                             }`}
                          >
                              <Plus size={14} />
                          </button>
                        )}
                      </div>

                      {/* 自定义输入框 */}
                      {isCustomSelected && (
                        <div className="animate-[fadeIn_0.3s_ease-out]">
                          <input
                            type="text"
                            value={customInputs[field.key] || ''}
                            onChange={(e) => handleCustomInputChange(field.key, e.target.value)}
                            className="w-full bg-transparent border-b border-ink/50 p-2 outline-none text-ink placeholder-stone-400 text-sm font-bold"
                            placeholder={`请输入${field.label.replace(' (多选)', '')}...`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 补充信息 */}
                {selectedSceneId !== '自定义' && (
                    <div className="space-y-3 pt-2">
                       <label className="text-base font-bold text-stone-500 tracking-widest flex items-center gap-2">
                          <span className="w-1 h-4 bg-stone-300 inline-block"></span>
                          补充信息 <span className="text-xs font-normal opacity-70">(可选)</span>
                       </label>
                       <textarea 
                          value={supplement}
                          onChange={(e) => setSupplement(e.target.value)}
                          placeholder="例：我不喝酒 / 只有我一个人..."
                          className="w-full bg-transparent border-b-2 border-stone-300 p-2 text-sm outline-none focus:border-ink transition-colors placeholder-stone-300 text-ink font-bold resize-none h-16"
                        />
                    </div>
                )}
                
                {selectedSceneId === '自定义' && (
                     <div className="space-y-3 pt-2">
                       <label className="text-lg font-black text-ink tracking-widest flex items-center gap-3">
                          <span className="w-1 h-6 bg-ink inline-block"></span>
                          您的处境
                       </label>
                       <textarea 
                          value={supplement}
                          onChange={(e) => setSupplement(e.target.value)}
                          placeholder="请详细描述您遇到的难题..."
                          className="w-full bg-transparent border-b-2 border-stone-300 p-2 text-base outline-none focus:border-ink transition-colors placeholder-stone-400 text-ink font-bold resize-none h-32"
                        />
                    </div>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="pt-10 pb-10">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full py-4 border-2 border-ink font-bold text-xl text-paper shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-3 ${
                    loading ? 'bg-stone-500 cursor-not-allowed' : 'bg-ink hover:bg-black'
                  }`}
                >
                  {loading ? (
                    <span className="tracking-widest animate-pulse">{statusText}</span>
                  ) : (
                    <>
                      <Feather size={20} />
                      <span className="tracking-[0.3em]">拆锦囊</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* 结果展示区 */}
            {showResults && (
              <div className="animate-[slideUp_0.4s_ease-out] pb-10">
                <div className="flex justify-between items-center mb-6 border-b-2 border-ink pb-2 border-double">
                  <h2 className="text-xl font-black text-ink tracking-widest">
                    {loading ? '推演中...' : '锦囊妙计'}
                  </h2>
                  {/* 修改：重设按钮改为刷新当前结果 */}
                  <button 
                    onClick={handleGenerate} 
                    className="text-xs font-bold text-stone-500 hover:text-ink flex items-center gap-1 active:rotate-180 transition-transform"
                    disabled={loading}
                  >
                    <RefreshCw size={12}/> 换一批
                  </button>
                </div>
                
                <div className="space-y-4">
                  {results.length === 0 && loading && (
                    <div className="text-center py-10 text-stone-400 font-serif font-medium animate-pulse">
                      师爷正在研墨...
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
