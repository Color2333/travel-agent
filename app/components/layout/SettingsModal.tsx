'use client';

import { useState, useEffect } from 'react';
import type { AIConfig, AIProvider } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: { value: AIProvider; label: string; models: string[] }[] = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] },
  { value: 'zhipu', label: 'Zhipu', models: ['glm-4', 'glm-3-turbo'] },
  { value: 'aliyun', label: 'Aliyun', models: ['qwen-max', 'qwen-turbo'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-latest'] },
];

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o',
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
    onClose();
  };

  const currentProvider = PROVIDERS.find((p) => p.value === config.provider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm w-full h-full"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      <div className="relative max-w-md w-full bg-white rounded-2xl p-6 animate-fade-in shadow-xl" role="dialog" aria-modal="true">
        <h2 className="text-xl font-bold mb-6 text-gray-900">AI Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              id="model-select"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              {currentProvider?.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              id="api-key-input"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.temperature.toFixed(1)}
            </label>
            <input
              id="temperature-slider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>1</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
