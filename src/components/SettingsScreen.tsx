import React, { useState } from 'react';
import { 
  Cpu, 
  Server, 
  ShieldCheck, 
  Palette, 
  Bell, 
  Info, 
  Check, 
  Lock, 
  Key, 
  Fingerprint,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { AIModel, OpenRouterConfig } from '../types';

interface SettingsScreenProps {
  availableModels: AIModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  openRouterConfig: OpenRouterConfig;
  onSaveOpenRouterKey: (key: string) => void;
  onRemoveOpenRouterKey: () => void;
  onTestOpenRouterConnection: () => Promise<{ success: boolean; message: string; latencyMs: number }>;
  onRefreshModels: () => void;
  onOpenModelCenter: () => void;
  isRefreshingModels?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  availableModels,
  selectedModelId,
  onSelectModel,
  openRouterConfig,
  onSaveOpenRouterKey,
  onRemoveOpenRouterKey,
  onTestOpenRouterConnection,
  onRefreshModels,
  onOpenModelCenter,
  isRefreshingModels = false,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  
  // API key modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);

  // Connection test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  const selectedModel = availableModels.find((m) => m.id === selectedModelId) || availableModels[0];

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    onSaveOpenRouterKey(keyInput.trim());
    setKeyInput('');
    setIsKeyModalOpen(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestOpenRouterConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Title */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
          System & Security Settings
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Configure OpenRouter AI provider, Keystore parameters, MCP endpoints, and operator policies
        </p>
      </div>

      {/* 1. AI Models & OpenRouter Gateway */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>AI Models & OpenRouter Gateway</span>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border self-start sm:self-auto ${
              openRouterConfig.isConnected
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                : 'bg-amber-950/50 text-amber-400 border-amber-800/60'
            }`}
          >
            {openRouterConfig.isConnected ? '● OpenRouter Connected' : '○ Not Configured'}
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          Universal model gateway routing to frontier and free models. Keystore hardware envelope encryption is strictly enforced.
        </p>

        {/* API Key Management Box */}
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-neutral-200">OpenRouter API Key</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {openRouterConfig.isConnected && openRouterConfig.maskedApiKey ? (
                  <span className="font-mono text-amber-400 font-semibold">
                    {openRouterConfig.maskedApiKey}
                  </span>
                ) : (
                  <span className="text-neutral-500">No secret key currently configured</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {openRouterConfig.isConnected ? (
                <>
                  <button
                    onClick={() => {
                      setKeyInput('');
                      setIsKeyModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-semibold border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Replace Key
                  </button>
                  <button
                    onClick={onRemoveOpenRouterKey}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 text-xs font-mono font-semibold border border-rose-800/40 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Configure Key
                </button>
              )}
            </div>
          </div>

          {/* Test Connection Row */}
          {openRouterConfig.isConnected && (
            <div className="pt-2 border-t border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-[11px] text-neutral-400">
                Verify credential authentication & server latency against OpenRouter API
              </div>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs font-mono border border-neutral-700 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          )}

          {/* Test feedback */}
          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs font-mono border flex items-center justify-between ${
                testResult.success
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                  : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
              }`}
            >
              <span>{testResult.message}</span>
              {testResult.success && <span>{testResult.latencyMs}ms</span>}
            </div>
          )}
        </div>

        {/* Global Default Model Selection Strip */}
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-neutral-200">Global Default Model</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Currently selected: <span className="text-amber-400 font-semibold">{selectedModel.name}</span>
                {selectedModel.isFree && ' (Free Tier)'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefreshModels}
                disabled={isRefreshingModels}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono border border-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingModels ? 'animate-spin' : ''}`} />
                <span>{isRefreshingModels ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={onOpenModelCenter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse Model Center</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] font-mono text-neutral-500">
            Catalog cached locally ({availableModels.length} models) · Last updated: {openRouterConfig.lastUpdated}
          </div>
        </div>
      </div>

      {/* 2. MCP Transport & Discovery */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Server className="w-4 h-4" />
          <span>MCP Transport & Discovery</span>
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-200">Default Transport Protocol</div>
              <div className="text-[11px] text-neutral-400">
                Server-Sent Events (SSE) stream over HTTPS
              </div>
            </div>
            <span className="font-mono text-amber-400 text-xs font-bold">SSE v1</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-200">Dynamic Tool Schema Parsing</div>
              <div className="text-[11px] text-neutral-400">
                Discovers WordPress action capabilities on remote connection
              </div>
            </div>
            <span className="font-mono text-emerald-400 text-xs font-bold">Enabled</span>
          </div>
        </div>
      </div>

      {/* 3. Security & Android Keystore */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Architecture & Hardware Keystore</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Hardware-Backed Keystore Storage
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                StrongBox / TEE Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Mandatory Security Rule: Secrets (OpenRouter API keys, WordPress Application Passwords, MCP Bearer Tokens) are NEVER stored in plain SharedPreferences. EncryptedSharedPreferences and MasterKey hardware envelope encryption are enforced.
            </p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Client Isolation Derivation
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                Strict Isolation
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              All credentials and conversation buffers are keyed strictly by siteId (<code className="text-amber-400">site_&#123;id&#125;_mcp_token</code>). A query targeted for Site A cannot retrieve or bind to Site B credentials.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                Biometric Approval Gate
              </div>
              <div className="text-[11px] text-neutral-400">
                Require biometric authentication before releasing dangerous action authorizations
              </div>
            </div>
            <input
              type="checkbox"
              checked={biometricsEnabled}
              onChange={(e) => setBiometricsEnabled(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Appearance & Notifications */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Palette className="w-4 h-4" />
          <span>Appearance & Notifications</span>
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-200">Theme Specification</div>
              <div className="text-[11px] text-neutral-400">
                Imperial Obsidian (Dark-First Command Center UI)
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-400">Locked Dark</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
            <div>
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Operator Approval Push Alerts
              </div>
              <div className="text-[11px] text-neutral-400">
                Notify instantly when AI queues dangerous tasks requiring human authorization
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. About */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>About IMPERIAL AI</span>
        </div>
        <div className="space-y-1.5 text-neutral-300">
          <div className="font-bold text-sm text-neutral-100">
            IMPERIAL AI — WordPress AI Command Center
          </div>
          <div className="text-amber-400 font-mono text-[11px]">
            Imperial Enterprise Kenya (Internal Application)
          </div>
          <p className="text-neutral-400 leading-relaxed pt-1">
            Phase 2 Architecture: OpenRouter AI Provider Integration, Dynamic Model Cataloging, SSE Streaming Engine, Token/Cost Metering, and Keystore API Key Encryption.
          </p>
        </div>
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>Version: 2.0.0-phase2</span>
          <span>Target SDK: 35 (Android 10 - 15)</span>
        </div>
      </div>

      {/* OpenRouter API Key Entry Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
                Configure OpenRouter API Key
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter your OpenRouter key (<code className="text-amber-400">sk-or-v1-...</code>). The key is sealed immediately inside Android Keystore and will only be displayed as masked (sk-or-••••••••••••••••).
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="relative">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  required
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-neutral-100 text-xs rounded-lg p-2.5 pr-10 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-200"
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!keyInput.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Save to Keystore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
