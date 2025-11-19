'use client';

import { useWorkflowStore } from '@/lib/workflow-store';
import { getSkillById } from '@/lib/skill-registry';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function NodeInspector() {
  const { selectedNode, updateNodeData, setSelectedNode } = useWorkflowStore();
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (selectedNode?.data.customPrompt) {
      setCustomPrompt(selectedNode.data.customPrompt);
    } else {
      setCustomPrompt('');
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const skill = selectedNode.data.skillId
    ? getSkillById(selectedNode.data.skillId)
    : null;

  const handleSave = () => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, { customPrompt });
    }
  };

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">Node Configuratie</h3>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {/* Node Info */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-1">
            Skill
          </div>
          <div className="text-sm text-gray-600">
            {selectedNode.data.label}
          </div>
        </div>

        {skill && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">
              Beschrijving
            </div>
            <div className="text-sm text-gray-600">
              {skill.description}
            </div>
          </div>
        )}

        {/* Custom Prompt */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Begeleidings Prompt (optioneel)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Deze prompt wordt gebruikt om Claude te begeleiden bij het uitvoeren van deze skill.
            De input van de vorige skill wordt automatisch toegevoegd.
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Bijv: Transformeer de tekst naar formele taal en gebruik geen afkortingen..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[120px]"
            rows={6}
          />
        </div>

        {/* Skill Parameters Info */}
        {skill && skill.inputs.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Verwachte Inputs
            </div>
            <div className="space-y-2">
              {skill.inputs.map((input) => (
                <div
                  key={input.name}
                  className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <div className="font-semibold text-gray-700">
                    {input.name}
                    {input.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </div>
                  <div className="text-gray-500">{input.description}</div>
                  <div className="text-gray-400 mt-1">Type: {input.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            Opslaan
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
