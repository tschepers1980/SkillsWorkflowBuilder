'use client';

import { useChatStore } from '@/lib/chat-store';
import { useWorkflowStore } from '@/lib/workflow-store';
import { X, Send, Loader2, Sparkles, Paperclip } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ClaudeModel } from '@/types/skills';

const MODEL_LABELS: Record<ClaudeModel, string> = {
  'claude-haiku-4-5-20251001': 'Haiku 4.5 (Snel & Goedkoop)',
  'claude-sonnet-4-5-20250929': 'Sonnet 4.5 (Gebalanceerd)',
  'claude-opus-4-1-20250805': 'Opus 4.1 (Meest Capabel)',
};

export default function ChatWindow() {
  const {
    messages,
    isOpen,
    isProcessing,
    model,
    setIsOpen,
    addMessage,
    clearMessages,
    setModel,
  } = useChatStore();

  const { nodes } = useWorkflowStore();
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  // Convert files to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isProcessing) return;

    const userMessage = input.trim();
    let messageContent = userMessage;

    // Convert files to base64
    const fileData = await Promise.all(
      uploadedFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: await fileToBase64(file),
      }))
    );

    // If files are uploaded, add file info to message
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map((f) => f.name).join(', ');
      messageContent = userMessage
        ? `${userMessage}\n\n📎 Bestanden: ${fileNames}`
        : `📎 Bestanden: ${fileNames}`;
    }

    setInput('');
    setUploadedFiles([]);

    // Add user message to chat
    addMessage({
      role: 'user',
      content: messageContent,
    });

    // Continue workflow execution with user input and files
    // This will be handled by the workflow execution logic
    window.dispatchEvent(
      new CustomEvent('chat-user-input', {
        detail: { message: userMessage, files: fileData },
      })
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    if (
      messages.length > 0 &&
      !confirm('Weet je zeker dat je de chat wilt sluiten? De conversatie wordt gewist.')
    ) {
      return;
    }
    setIsOpen(false);
    clearMessages();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold">Workflow Chat</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ClaudeModel)}
              className="px-3 py-1.5 text-sm rounded-md border border-white/20 bg-white/10 text-white backdrop-blur"
              disabled={isProcessing}
            >
              {Object.entries(MODEL_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="text-gray-900">
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm">
          <div className="text-blue-800">
            <strong>Workflow:</strong> {nodes.length} skill{nodes.length !== 1 ? 's' : ''} in deze workflow
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Start een conversatie met Claude</p>
              <p className="text-sm mt-2">
                Claude zal je begeleiden door de workflow
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-gray-100 text-gray-700 border border-gray-200'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.role === 'system' && (
                    <div className="text-xs font-semibold mb-1 text-gray-500">
                      SYSTEEM
                    </div>
                  )}
                  {message.nodeId && (
                    <div className="text-xs font-semibold mb-1 opacity-80">
                      {nodes.find((n) => n.id === message.nodeId)?.data.label}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('nl-NL')}
                  </div>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          {/* File upload indicator */}
          {uploadedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>{file.name}</span>
                  <button
                    onClick={() =>
                      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                    }
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.txt,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Bestand uploaden"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type je bericht..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none"
              rows={2}
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedFiles.length === 0) || isProcessing}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Druk op Enter om te versturen, Shift+Enter voor nieuwe regel. Ondersteunde bestanden: PDF, Excel, CSV, TXT, JSON
          </div>
        </div>
      </div>
    </div>
  );
}
