// Types voor Claude Code Skills en Workflow Nodes

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  inputs: SkillParameter[];
  outputs: {
    name: string;
    type: string;
    description: string;
  }[];
  execute?: (inputs: Record<string, any>) => Promise<any>;
}

export interface WorkflowNode {
  id: string;
  type: 'skill' | 'input' | 'output';
  position: { x: number; y: number };
  data: {
    skillId?: string;
    label: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    customPrompt?: string; // Optionele prompt ter begeleiding van deze skill
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export type ClaudeModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-5-20250929' | 'claude-opus-4-1-20250805';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  startPrompt?: string; // Optionele start prompt voor de workflow
  model?: ClaudeModel; // Model keuze voor de workflow
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  skillId?: string; // Welke skill heeft dit bericht gegenereerd
  nodeId?: string; // Welke node in de workflow
}
