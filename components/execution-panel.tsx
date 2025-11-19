'use client';

import { useWorkflowStore } from '@/lib/workflow-store';
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ExecutionPanel() {
  const { nodes, executionResults, isExecuting } = useWorkflowStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Execution Results</h2>
        {isExecuting && (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {nodes.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Geen nodes om uit te voeren
        </p>
      ) : (
        <div className="space-y-2">
          {nodes.map(node => {
            const result = executionResults.get(node.id);
            const isExpanded = expandedNodes.has(node.id);
            const status = node.data.status;

            return (
              <div
                key={node.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Node Header */}
                <div
                  className="p-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleNode(node.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}

                  {/* Status Icon */}
                  {status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {status === 'error' && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  {status === 'running' && (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {!status && (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">
                      {node.data.label}
                    </div>
                    {status && (
                      <div className="text-xs text-gray-500 capitalize">
                        {status}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && result && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    {result.success ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700">
                          Output:
                        </div>
                        <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                          {JSON.stringify(result.output, null, 2)}
                        </pre>
                        <div className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleString('nl-NL')}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-red-700">
                          Error:
                        </div>
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                          {result.error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {executionResults.size > 0 && !isExecuting && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>Workflow voltooid!</strong>
            <br />
            {executionResults.size} node(s) uitgevoerd
          </p>
        </div>
      )}
    </div>
  );
}
