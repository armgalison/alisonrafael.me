'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, Eye, EyeOff } from 'lucide-react';
import { easeOut } from '../../lib/motion.js';

interface ChatConfig {
  id: string;
  systemPromptTemplate: string;
  description: string | null;
  updatedAt: string;
}

interface Version {
  id: string;
  createdAt: string;
  changeReason: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export function ChatConfigPage() {
  const [template, setTemplate] = useState('');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [history, setHistory] = useState<Version[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-preview when template changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (template) {
        generatePreview();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [template]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin.token') : null;

      const res = await fetch(`${API_URL}/chat/config/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load config');

      const data: ChatConfig = await res.json();
      setTemplate(data.systemPromptTemplate);

      // Load history
      const historyRes = await fetch(`${API_URL}/chat/config/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.versions);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin.token') : null;

      const res = await fetch(`${API_URL}/chat/config/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ systemPromptTemplate: template }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreview(data.preview);
      }
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin.token') : null;

      const res = await fetch(`${API_URL}/chat/config/template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          systemPromptTemplate: template,
          reason: changeReason || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to save config');

      setSuccess(true);
      setChangeReason('');
      setTimeout(() => setSuccess(false), 3000);

      // Reload history
      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default system prompt? This will save to history.')) return;

    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin.token') : null;

      const res = await fetch(`${API_URL}/chat/config/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Reset to default' }),
      });

      if (!res.ok) throw new Error('Failed to reset config');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Chat System Prompt</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Configure the AI assistant's behavior and context with template variables
        </p>
      </div>

      {/* Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 px-4 py-3 rounded text-sm text-red-800 dark:text-red-200"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 px-4 py-3 rounded text-sm text-green-800 dark:text-green-200"
        >
          ✅ Configuration saved successfully
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold mb-2">System Prompt Template</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter system prompt template..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Available variables: {'{name}'}, {'{headline}'}, {'{skills}'}, {'{summary}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Change Reason (Optional)</label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g., Updated skills section"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </motion.div>

        {/* Preview / History */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: easeOut }}
          className="space-y-4"
        >
          {showPreview && (
            <div>
              <label className="block text-sm font-semibold mb-2">Preview</label>
              <div className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm overflow-auto whitespace-pre-wrap break-words">
                {preview || 'No preview available'}
              </div>
            </div>
          )}

          {!showPreview && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold">Version History</label>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {showHistory ? 'Hide' : 'Show'} ({history.length})
                </button>
              </div>

              {showHistory && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No history yet</p>
                  ) : (
                    history.map((version) => (
                      <div
                        key={version.id}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                        {version.changeReason && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {version.changeReason}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-2">Template Variables</p>
            <ul className="space-y-1 text-xs">
              <li>
                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">{'{name}'}</code> - User's full name
              </li>
              <li>
                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">{'{headline}'}</code> - Professional headline
              </li>
              <li>
                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">{'{skills}'}</code> - Comma-separated skills
              </li>
              <li>
                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">{'{summary}'}</code> - Professional summary
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
