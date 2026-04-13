'use client';

import { useState } from 'react';
import { Star, X, MapPin, Trash2 } from 'lucide-react';
import { useFavoriteCities } from '@/lib/hooks/useFavoriteCities';
import { stage } from '@/lib/ui/stage';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: { name: string; lat: number; lng: number; qweatherId?: string }) => void;
}

export default function FavoritesDrawer({ isOpen, onClose, onSelectCity }: FavoritesDrawerProps) {
  const { favorites, isLoaded, removeFavorite, clearFavorites } = useFavoriteCities();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-end pt-20 sm:pt-24 pr-3 sm:pr-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={stage.panelShell(false, 'relative z-10 w-full max-w-sm rounded-[28px] p-0 shadow-2xl h-[calc(100vh-140px)] flex flex-col')}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/50 p-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="font-semibold panel-t1">收藏城市</h3>
            <span className="text-xs panel-t3 text-slate-500">
              {favorites.length}个
            </span>
          </div>
          <div className="flex items-center gap-1">
            {favorites.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                className="rounded-xl p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500"
                title="清空所有收藏"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {!isLoaded && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm panel-t2 text-slate-500">加载中...</p>
            </div>
          )}

          {isLoaded && favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm panel-t2 text-slate-500">暂无收藏城市</p>
              <p className="text-xs panel-t3 text-slate-400 mt-1">
                在城市卡片上点击星标添加收藏
              </p>
            </div>
          )}

          {isLoaded && favorites.length > 0 && (
            <div className="space-y-1">
              {favorites.map((city) => (
                <div
                  key={city.id}
                  className="group flex items-center gap-3 rounded-2xl p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onSelectCity({
                        name: city.name,
                        lat: city.lat,
                        lng: city.lng,
                        qweatherId: city.qweatherId,
                      });
                      onClose();
                    }}
                  >
                    <p className="font-medium panel-t1">{city.name}</p>
                    {city.province && (
                      <p className="text-xs panel-t3 text-slate-500">
                        {city.province.replace('省', '').replace('自治区', '')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFavorite(city.name)}
                    className="opacity-0 group-hover:opacity-100 rounded-xl p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all"
                    title="移除收藏"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {favorites.length > 0 && (
          <div className="border-t border-slate-100/50 px-4 py-2.5 dark:border-white/10">
            <p className="text-xs panel-t3 text-slate-400">
              点击城市快速查询 · 支持天气提醒
            </p>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className={stage.subpanel('relative z-10 rounded-[24px] p-5 max-w-xs')}>
            <h4 className="font-semibold panel-t1 mb-2">确认清空所有收藏？</h4>
            <p className="text-sm panel-t2 text-slate-500 mb-4">
              此操作不可恢复，将删除所有 {favorites.length} 个收藏城市。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium panel-t2 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                取消
              </button>
              <button
                onClick={() => {
                  clearFavorites();
                  setShowConfirm(false);
                }}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium bg-red-500 text-white hover:bg-red-600"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
