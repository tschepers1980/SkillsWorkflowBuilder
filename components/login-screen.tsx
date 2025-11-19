'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Sparkles, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('Voer een geldige API key in');
      return;
    }

    // Validate format (Anthropic API keys start with 'sk-ant-')
    if (!apiKey.startsWith('sk-ant-')) {
      setError('Ongeldige API key formaat. Claude API keys beginnen met "sk-ant-"');
      return;
    }

    const result = await login(apiKey);

    if (!result.success) {
      setError(result.error || 'Authenticatie mislukt');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Claude Skills Workflow
          </h1>
          <p className="text-gray-600">
            Log in met je Anthropic API key
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key Input */}
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Anthropic API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api..."
                  className="
                    w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    text-sm font-mono
                  "
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showApiKey ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Je API key wordt veilig versleuteld opgeslagen en alleen gebruikt voor
                jouw workflow executions
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="
                w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500
                text-white font-semibold rounded-lg shadow-md
                hover:from-blue-600 hover:to-purple-600
                disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticeren...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Inloggen
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Heb je nog geen API key?{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Maak er een aan →
              </a>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Je API key wordt lokaal opgeslagen en nooit gedeeld
          </p>
        </div>
      </div>
    </div>
  );
}
