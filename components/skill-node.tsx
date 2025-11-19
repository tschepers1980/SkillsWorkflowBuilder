'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import * as Icons from 'lucide-react';
import { getSkillById } from '@/lib/skill-registry';

const SkillNode = ({ data, selected }: NodeProps) => {
  const skill = data.skillId ? getSkillById(data.skillId) : null;

  // Get icon component
  const IconComponent = skill && skill.icon in Icons
    ? Icons[skill.icon as keyof typeof Icons]
    : Icons.Box;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px]
        ${selected ? 'border-blue-500' : 'border-gray-300'}
        transition-all duration-200 hover:shadow-xl
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500"
      />

      {/* Node Content */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-100 rounded">
          {/* @ts-ignore */}
          <IconComponent className="w-4 h-4 text-blue-600" />
        </div>
        <div className="font-semibold text-sm text-gray-800">
          {data.label}
        </div>
      </div>

      {skill && (
        <div className="text-xs text-gray-500 mb-2">
          {skill.description}
        </div>
      )}

      {/* Status indicator */}
      {data.status && (
        <div className={`
          text-xs px-2 py-1 rounded mt-2
          ${data.status === 'success' ? 'bg-green-100 text-green-700' : ''}
          ${data.status === 'error' ? 'bg-red-100 text-red-700' : ''}
          ${data.status === 'running' ? 'bg-yellow-100 text-yellow-700' : ''}
        `}>
          {data.status}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  );
};

export default memo(SkillNode);
