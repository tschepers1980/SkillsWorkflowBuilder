import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import { Workflow } from '@/types/skills';

// Helper function to get API key from auth storage
function getEncryptedApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;
  try {
    const data = JSON.parse(authStorage);
    return data.state?.user?.apiKey || null;
  } catch {
    return null;
  }
}

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  isExecuting: boolean;
  executionResults: Map<string, any>;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  setSelectedNode: (node: Node | null) => void;

  // Workflow management
  saveWorkflow: (name: string, description?: string) => Workflow;
  loadWorkflow: (workflow: Workflow) => void;
  clearWorkflow: () => void;

  // Execution
  executeWorkflow: () => Promise<void>;
  executeWorkflowWithChat: (startPrompt?: string, model?: string) => Promise<void>;
  setExecutionResult: (nodeId: string, result: any) => void;

  // Workflow settings
  workflowStartPrompt: string;
  workflowModel: string;
  setWorkflowStartPrompt: (prompt: string) => void;
  setWorkflowModel: (model: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,
  executionResults: new Map(),
  workflowStartPrompt: '',
  workflowModel: 'claude-haiku-4-5-20251001',

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  saveWorkflow: (name, description) => {
    const workflow: Workflow = {
      id: crypto.randomUUID(),
      name,
      description,
      nodes: get().nodes as any,
      edges: get().edges as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to localStorage
    const savedWorkflows = JSON.parse(
      localStorage.getItem('workflows') || '[]'
    );
    savedWorkflows.push(workflow);
    localStorage.setItem('workflows', JSON.stringify(savedWorkflows));

    return workflow;
  },

  loadWorkflow: (workflow) => {
    set({
      nodes: workflow.nodes as any,
      edges: workflow.edges as any,
    });
  },

  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      executionResults: new Map(),
    });
  },

  executeWorkflow: async () => {
    set({ isExecuting: true, executionResults: new Map() });

    const { nodes, edges } = get();
    const results = new Map();

    // Topological sort voor juiste executie volgorde
    const executed = new Set<string>();
    const executing = new Set<string>();

    async function executeNode(nodeId: string): Promise<any> {
      if (executed.has(nodeId)) {
        return results.get(nodeId);
      }

      if (executing.has(nodeId)) {
        throw new Error(`Circular dependency detected at node ${nodeId}`);
      }

      executing.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return null;

      // Vind alle dependencies (input edges)
      const inputEdges = edges.filter(e => e.target === nodeId);

      // Executeer eerst alle dependencies
      for (const edge of inputEdges) {
        await executeNode(edge.source);
      }

      // Collect inputs from connected nodes
      const inputs: Record<string, any> = { ...node.data.inputs };
      for (const edge of inputEdges) {
        const sourceResult = results.get(edge.source);
        if (sourceResult && edge.sourceHandle) {
          inputs[edge.targetHandle || 'input'] = sourceResult[edge.sourceHandle];
        }
      }

      // Update node status to running
      get().updateNodeData(nodeId, { status: 'running' });

      // Execute node via API
      let result;
      try {
        const encryptedApiKey = getEncryptedApiKey();
        if (!encryptedApiKey) {
          throw new Error('Geen API key gevonden. Log opnieuw in.');
        }

        const response = await fetch('/api/execute-skill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': encryptedApiKey,
          },
          body: JSON.stringify({
            skillId: node.data.skillId,
            inputs,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Skill execution failed');
        }

        result = {
          success: true,
          output: data.output,
          timestamp: data.timestamp,
        };

        // Update node status to success
        get().updateNodeData(nodeId, { status: 'success' });

      } catch (error: any) {
        result = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        // Update node status to error
        get().updateNodeData(nodeId, { status: 'error' });
      }

      results.set(nodeId, result);
      executed.add(nodeId);
      executing.delete(nodeId);

      get().setExecutionResult(nodeId, result);

      return result;
    }

    try {
      // Executeer alle nodes
      for (const node of nodes) {
        if (!executed.has(node.id)) {
          await executeNode(node.id);
        }
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
    } finally {
      set({ isExecuting: false });
    }
  },

  setExecutionResult: (nodeId, result) => {
    const results = new Map(get().executionResults);
    results.set(nodeId, result);
    set({ executionResults: results });
  },

  executeWorkflowWithChat: async (startPrompt?: string, model?: string) => {
    // This function is called from the toolbar
    // It signals that we want to execute with chat mode
    // The actual execution happens via the chat window
    set({
      isExecuting: true,
      executionResults: new Map(),
      workflowStartPrompt: startPrompt || get().workflowStartPrompt,
      workflowModel: model || get().workflowModel,
    });

    // Open chat window is handled by the component listening to this state
    // The chat window will handle the actual step-by-step execution
  },

  setWorkflowStartPrompt: (prompt) => set({ workflowStartPrompt: prompt }),

  setWorkflowModel: (model) => set({ workflowModel: model }),
}));
