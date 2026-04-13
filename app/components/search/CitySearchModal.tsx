'use client';

import { useState, useMemo } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { CITIES } from '@/lib/cities/data';
import { stage } from '@/lib/ui/stage';

export interface CitySearchResult {
  name: string;
  lat: number;
  lng: number;
  qweatherId?: string;
  province?: string;
  matchType: 'exact' | 'partial' | 'pinyin';
}

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: CitySearchResult) => void;
}

export default function CitySearchModal({ isOpen, onClose, onSelectCity }: CitySearchModalProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CitySearchResult | null>(null);

  const results: CitySearchResult[] = useMemo(() => {
    if (!query.trim()) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const exactMatches: CitySearchResult[] = [];
    const partialMatches: CitySearchResult[] = [];

    for (const city of CITIES) {
      const normalizedName = city.name;
      
      // 精确匹配
      if (normalizedName === query.trim()) {
        exactMatches.push({ ...city, matchType: 'exact' });
        continue;
      }

      // 部分匹配（包含查询字符串）
      if (normalizedName.includes(normalizedQuery)) {
        partialMatches.push({ ...city, matchType: 'partial' });
        continue;
      }

      // 拼音首字母匹配（简单实现）
      const pinyinInitials = getPinyinInitials(city.name).toLowerCase();
      if (pinyinInitials.includes(normalizedQuery)) {
        partialMatches.push({ ...city, matchType: 'pinyin' });
      }
    }

    // 按匹配类型和字母顺序排序
    return [...exactMatches, ...partialMatches].slice(0, 20);
  }, [query]);

  const handleSelect = (city: CitySearchResult) => {
    setSelected(city);
    onSelectCity(city);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-24">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={stage.panelShell(false, 'relative z-10 w-full max-w-lg rounded-[32px] p-0 shadow-2xl')}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100/50 p-4 dark:border-white/10">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索城市（支持拼音首字母，如 'bj' 搜索北京）"
            className="flex-1 bg-transparent text-base panel-t1 outline-none placeholder:text-slate-400"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm panel-t2 text-slate-500">未找到匹配的城市</p>
              <p className="text-xs panel-t3 text-slate-400 mt-1">试试拼音首字母或简化关键词</p>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center">
              <p className="text-sm panel-t2 text-slate-500">输入城市名称开始搜索</p>
              <p className="text-xs panel-t3 text-slate-400 mt-2">
                支持 191+ 城市 · 拼音首字母 · 部分匹配
              </p>
            </div>
          )}

          {results.map((city, index) => (
            <button
              key={`${city.name}-${index}`}
              onClick={() => handleSelect(city)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                selected?.name === city.name
                  ? 'bg-sky-100/70 dark:bg-sky-500/20'
                  : 'hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium panel-t1">{city.name}</p>
                {city.qweatherId && (
                  <p className="text-xs panel-t3 text-slate-500">
                    ID: {city.qweatherId}
                  </p>
                )}
              </div>
              {city.matchType === 'exact' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  精确匹配
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="border-t border-slate-100/50 px-4 py-2.5 dark:border-white/10">
            <p className="text-xs panel-t3 text-slate-400">
              显示 {results.length} 个结果 · 点击选择城市
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 简单的拼音首字母转换（常用城市）
function getPinyinInitials(chinese: string): string {
  // 使用数组存储映射，避免重复键问题
  const pinyinEntries: [string, string][] = [
    ['北', 'b'], ['京', 'j'], ['上', 's'], ['海', 'h'], ['天', 't'], ['津', 'j'],
    ['重', 'c'], ['庆', 'q'], ['南', 'n'], ['广', 'g'], ['州', 'z'], ['深', 's'], ['圳', 'z'],
    ['杭', 'h'], ['苏', 's'], ['无', 'w'], ['锡', 'x'], ['常', 'c'], ['成', 'c'], ['都', 'd'],
    ['武', 'w'], ['汉', 'h'], ['西', 'x'], ['安', 'a'], ['郑', 'z'], ['长', 'c'], ['沙', 's'],
    ['合', 'h'], ['肥', 'f'], ['福', 'f'], ['厦', 'x'], ['门', 'm'],
    ['昆', 'k'], ['明', 'm'], ['贵', 'g'], ['阳', 'y'], ['沈', 's'], ['大', 'd'], ['连', 'l'],
    ['哈', 'h'], ['尔', 'e'], ['滨', 'b'], ['春', 'c'], ['石', 's'], ['家', 'j'], ['庄', 'z'],
    ['太', 't'], ['原', 'y'], ['呼', 'h'], ['和', 'h'], ['浩', 'h'], ['特', 't'],
    ['济', 'j'], ['青', 'q'], ['岛', 'd'], ['烟', 'y'], ['台', 't'],
    ['扬', 'y'], ['镇', 'z'], ['泰', 't'], ['徐', 'x'], ['盐', 'y'],
    ['温', 'w'], ['宁', 'n'], ['嘉', 'j'], ['兴', 'x'], ['绍', 's'], ['舟', 'z'], ['金', 'j'], ['华', 'h'],
    ['珠', 'z'], ['佛', 'f'], ['东', 'd'], ['莞', 'g'], ['中', 'z'], ['江', 'j'], ['肇', 'z'], ['清', 'q'],
    ['绵', 'm'], ['德', 'd'], ['乐', 'l'], ['宜', 'y'], ['宾', 'b'], ['泸', 'l'], ['充', 'c'],
    ['襄', 'x'], ['荆', 'j'], ['十', 's'], ['堰', 'y'], ['孝', 'x'], ['感', 'g'], ['冈', 'g'],
    ['潍', 'w'], ['坊', 'f'], ['威', 'w'], ['日', 'r'], ['照', 'z'], ['临', 'l'], ['沂', 'y'],
    ['开', 'k'], ['封', 'f'], ['新', 'x'], ['乡', 'x'], ['许', 'x'], ['昌', 'c'],
    ['理', 'l'], ['香', 'x'], ['格', 'g'], ['里', 'l'], ['拉', 'l'], ['丽', 'l'],
    ['黄', 'h'], ['山', 's'], ['峨', 'e'], ['眉', 'm'], ['夷', 'y'], ['九', 'j'], ['寨', 'z'], ['沟', 'g'],
  ];

  // 转换为对象，后面的覆盖前面的
  const pinyinMap = Object.fromEntries(pinyinEntries);

  return chinese.split('').map(char => pinyinMap[char] || char).join('');
}
