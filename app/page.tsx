'use client';

import { useCallback } from 'react';
import WorkflowCanvas from '@/components/workflow-canvas';
import SkillsSidebar from '@/components/skills-sidebar';
import WorkflowToolbar from '@/components/workflow-toolbar';
import ExecutionPanel from '@/components/execution-panel';
import ChatWindow from '@/components/chat-window';
import NodeInspector from '@/components/node-inspector';
import WorkflowChatExecutor from '@/components/workflow-chat-executor';
import ProtectedRoute from '@/components/protected-route';

export default function Home() {
  const onDragStart = useCallback((event: React.DragEvent, skillId: string) => {
    event.dataTransfer.setData('application/reactflow', skillId);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <WorkflowToolbar />

        <div className="flex flex-1 overflow-hidden relative">
          <SkillsSidebar onDragStart={onDragStart} />
          <WorkflowCanvas />
          <ExecutionPanel />
          <NodeInspector />
        </div>

        <ChatWindow />
        <WorkflowChatExecutor />
      </div>
    </ProtectedRoute>
  );
}
