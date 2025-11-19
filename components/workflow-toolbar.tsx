'use client';

import { useState, useRef } from 'react';
import { Save, FolderOpen, Play, Trash2, Download, Settings, MessageSquare, LogOut, User, Paperclip, X } from 'lucide-react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/auth-store';
import { Workflow, ClaudeModel } from '@/types/skills';

export default function WorkflowToolbar() {
  const {
    nodes,
    edges,
    saveWorkflow,
    loadWorkflow,
    clearWorkflow,
    executeWorkflow,
    isExecuting,
    workflowStartPrompt,
    workflowModel,
    setWorkflowStartPrompt,
    setWorkflowModel,
  } = useWorkflowStore();

  const { setIsOpen: setChatOpen, setModel: setChatModel, setWorkflowStartPrompt: setChatStartPrompt, addMessage, clearMessages } = useChatStore();
  const { user, logout } = useAuthStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
  const [tempStartPrompt, setTempStartPrompt] = useState(workflowStartPrompt);
  const [tempModel, setTempModel] = useState<ClaudeModel>(workflowModel as ClaudeModel);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [executionInput, setExecutionInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Geef een naam op voor de workflow');
      return;
    }

    saveWorkflow(workflowName, workflowDescription);
    setWorkflowName('');
    setWorkflowDescription('');
    setShowSaveDialog(false);
    alert('Workflow opgeslagen!');
  };

  const handleLoadDialogOpen = () => {
    const workflows = JSON.parse(
      localStorage.getItem('workflows') || '[]'
    ) as Workflow[];
    setSavedWorkflows(workflows);
    setShowLoadDialog(true);
  };

  const handleLoad = (workflow: Workflow) => {
    loadWorkflow(workflow);
    setShowLoadDialog(false);
  };

  const handleExport = () => {
    const workflow = {
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    setWorkflowStartPrompt(tempStartPrompt);
    setWorkflowModel(tempModel);
    setShowSettingsDialog(false);
    alert('Workflow instellingen opgeslagen!');
  };

  const handleExecuteWithChat = () => {
    // Clear previous chat
    clearMessages();

    // Set chat configuration
    setChatModel(workflowModel as ClaudeModel);
    setChatStartPrompt(workflowStartPrompt);

    // Add system message if there's a start prompt
    if (workflowStartPrompt) {
      addMessage({
        role: 'system',
        content: `Workflow Start Prompt: ${workflowStartPrompt}`,
      });
    }

    // Add initial message from Claude
    addMessage({
      role: 'assistant',
      content: `Hallo! Ik ga je helpen met het uitvoeren van deze workflow met ${nodes.length} skill(s). Laten we beginnen!`,
    });

    // Open chat window
    setChatOpen(true);
  };

  const handleQuickExecute = () => {
    // Show file upload dialog before execution
    setShowFileUploadDialog(true);
  };

  const handleExecuteWithFiles = () => {
    // Close dialog
    setShowFileUploadDialog(false);

    // Execute workflow
    // TODO: Pass files to executeWorkflow when API supports it
    executeWorkflow();

    // Reset state
    setUploadedFiles([]);
    setExecutionInput('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const handleLogout = () => {
    if (
      confirm(
        'Weet je zeker dat je wilt uitloggen? Je huidige workflow wordt niet opgeslagen.'
      )
    ) {
      logout();
      clearWorkflow();
    }
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">
            Claude Skills Workflow Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={nodes.length === 0}
            className="
              flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md
              hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>

          <button
            onClick={handleLoadDialogOpen}
            className="
              flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md
              hover:bg-gray-600 transition-colors
            "
          >
            <FolderOpen className="w-4 h-4" />
            Laden
          </button>

          <button
            onClick={handleExport}
            disabled={nodes.length === 0}
            className="
              flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md
              hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <Download className="w-4 h-4" />
            Exporteren
          </button>

          <div className="w-px h-8 bg-gray-300" />

          <button
            onClick={() => setShowSettingsDialog(true)}
            className="
              flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md
              hover:bg-gray-700 transition-colors
            "
          >
            <Settings className="w-4 h-4" />
            Instellingen
          </button>

          <button
            onClick={handleQuickExecute}
            disabled={nodes.length === 0 || isExecuting}
            className="
              flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md
              hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <Play className="w-4 h-4" />
            {isExecuting ? 'Uitvoeren...' : 'Snel Uitvoeren'}
          </button>

          <button
            onClick={handleExecuteWithChat}
            disabled={nodes.length === 0 || isExecuting}
            className="
              flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md
              hover:from-blue-600 hover:to-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-all shadow-md
            "
          >
            <MessageSquare className="w-4 h-4" />
            Chat Uitvoeren
          </button>

          <button
            onClick={clearWorkflow}
            disabled={nodes.length === 0}
            className="
              flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md
              hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <Trash2 className="w-4 h-4" />
            Wissen
          </button>

          <div className="w-px h-8 bg-gray-300" />

          {/* User Info & Logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {user?.email || user?.id.substring(0, 8) + '...'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md
                hover:bg-gray-700 transition-colors
              "
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </button>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Workflow Opslaan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Naam</label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Mijn workflow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Beschrijving (optioneel)
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Wat doet deze workflow?"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Workflow Laden</h2>

            {savedWorkflows.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Geen opgeslagen workflows gevonden
              </p>
            ) : (
              <div className="space-y-2">
                {savedWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="
                      p-3 border border-gray-200 rounded-lg hover:border-blue-400
                      cursor-pointer transition-colors
                    "
                    onClick={() => handleLoad(workflow)}
                  >
                    <div className="font-semibold">{workflow.name}</div>
                    {workflow.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {workflow.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {workflow.nodes.length} nodes • {workflow.edges.length} verbindingen
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl">
            <h2 className="text-lg font-bold mb-4">Workflow Instellingen</h2>
            <div className="space-y-4">
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Claude Model
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value as ClaudeModel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="claude-3-5-haiku-20241022">
                    Haiku (Snel & Goedkoop)
                  </option>
                  <option value="claude-3-5-sonnet-20241022">
                    Sonnet (Gebalanceerd)
                  </option>
                  <option value="claude-opus-4-20250514">
                    Opus (Meest Capabel)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Kies het Claude model voor de workflow execution
                </p>
              </div>

              {/* Start Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Workflow Start Prompt (optioneel)
                </label>
                <textarea
                  value={tempStartPrompt}
                  onChange={(e) => setTempStartPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={6}
                  placeholder="Bijv: Je bent een expert data analist. Help de gebruiker met het verwerken en analyseren van hun data..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deze prompt wordt gebruikt als context voor de hele workflow.
                  Claude zal deze prompt gebruiken als basis voor alle skills.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowSettingsDialog(false);
                    setTempStartPrompt(workflowStartPrompt);
                    setTempModel(workflowModel as ClaudeModel);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Dialog for Quick Execute */}
      {showFileUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Snelle Uitvoering</h2>

            <div className="space-y-4">
              {/* Optional Input Message */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Optionele Input (optioneel)
                </label>
                <textarea
                  value={executionInput}
                  onChange={(e) => setExecutionInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Voeg een bericht toe voor de eerste skill..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bestanden Uploaden (optioneel)
                </label>
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
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <Paperclip className="w-4 h-4" />
                  Bestanden Selecteren
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Ondersteunde formaten: PDF, Excel, CSV, TXT, JSON
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Geselecteerde Bestanden:
                  </label>
                  <div className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setUploadedFiles(
                              uploadedFiles.filter((_, i) => i !== index)
                            )
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowFileUploadDialog(false);
                    setUploadedFiles([]);
                    setExecutionInput('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleExecuteWithFiles}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Play className="w-4 h-4 inline mr-2" />
                  Uitvoeren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
