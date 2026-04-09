'use client';

import { useState, useEffect } from 'react';
import { X, Key, Thermometer, Hash, Cpu, Sparkles } from 'lucide-react';
import type { AIConfig, AIProvider } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: { value: AIProvider; label: string; models: string[]; description: string }[] = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o'], description: '使用 OpenAI 兼容接口，适合通用对话' },
  { value: 'zhipu', label: '智谱 AI', models: ['glm-4.7', 'glm-4'], description: '默认配置，适合中文旅行场景' },
];

const DEFAULT_CONFIG: AIConfig = {
  provider: 'zhipu',
  model: 'glm-4.7',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 2048,
};

function getStoredConfig(): AIConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  const stored = localStorage.getItem('ai_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredConfig());
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('ai-config-updated'));
    onClose();
  };

  const currentProvider = PROVIDERS.find((p) => p.value === config.provider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm w-full h-full"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div
        className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] sm:max-h-none"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">AI 设置</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh] sm:max-h-none">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 pb-1 border-b border-gray-100">
              <Cpu className="w-4 h-4 text-primary-500" />
              <span>模型配置</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700">服务商</label>
              <select
                id="provider-select"
                value={config.provider}
                onChange={(e) => {
                  const provider = e.target.value as AIProvider;
                  const providerData = PROVIDERS.find((p) => p.value === provider);
                  setConfig({
                    ...config,
                    provider,
                    model: providerData?.models[0] || '',
                  });
                }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all bg-gray-50/50"
              >
                {PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">{currentProvider?.description}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">模型</label>
              <select
                id="model-select"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all bg-gray-50/50"
              >
                {currentProvider?.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 pb-1 border-b border-gray-100">
              <Key className="w-4 h-4 text-primary-500" />
              <span>认证</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700">API Key</label>
              <div className="relative">
                <input
                  id="api-key-input"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="输入你的 API Key"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all bg-gray-50/50"
                />
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">API Key 仅存储在本地浏览器中</p>
              <p className="text-xs text-gray-500">留空时使用服务端环境变量</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 pb-1 border-b border-gray-100">
              <Thermometer className="w-4 h-4 text-primary-500" />
              <span>参数</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="temperature-slider" className="text-sm font-medium text-gray-700">Temperature</label>
                <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{config.temperature.toFixed(1)}</span>
              </div>
              <input
                id="temperature-slider"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>保守</span>
                <span>平衡</span>
                <span>创意</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <label htmlFor="max-tokens" className="text-sm font-medium text-gray-700">Max Tokens</label>
              </div>
              <input
                id="max-tokens"
                type="number"
                min="256"
                max="4096"
                step="256"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all bg-gray-50/50"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-white hover:border-gray-300 transition-all"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-md shadow-primary-200"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
