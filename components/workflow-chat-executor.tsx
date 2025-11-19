'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useWorkflowStore } from '@/lib/workflow-store';
import { useAuthStore } from '@/lib/auth-store';
import { getSkillById } from '@/lib/skill-registry';

/**
 * This component handles the step-by-step execution of workflow via chat
 */
export default function WorkflowChatExecutor() {
  const { isOpen, messages, addMessage, setIsProcessing, model, workflowStartPrompt } =
    useChatStore();
  const { nodes, edges } = useWorkflowStore();
  const { user } = useAuthStore();

  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [nodeOutputs, setNodeOutputs] = useState<Map<string, any>>(new Map());
  const [userInputReceived, setUserInputReceived] = useState(false);
  const executingRef = useRef(false);
  const waitingForUserRef = useRef(false);
  const hasStartedRef = useRef(false);
  const currentFilesRef = useRef<any[]>([]);

  // Get sorted nodes (topological order)
  const getSortedNodes = () => {
    const sorted: typeof nodes = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    function visit(nodeId: string) {
      if (temp.has(nodeId)) return; // Cycle detection
      if (visited.has(nodeId)) return;

      temp.add(nodeId);

      const inputEdges = edges.filter((e) => e.target === nodeId);
      for (const edge of inputEdges) {
        visit(edge.source);
      }

      temp.delete(nodeId);
      visited.add(nodeId);

      const node = nodes.find((n) => n.id === nodeId);
      if (node) sorted.push(node);
    }

    nodes.forEach((node) => visit(node.id));
    return sorted;
  };

  // Execute current skill
  const executeCurrentSkill = useCallback(async () => {
    console.log('executeCurrentSkill called', {
      executingRef: executingRef.current,
      waitingForUserRef: waitingForUserRef.current,
      currentNodeIndex,
      nodesLength: nodes.length,
    });

    if (executingRef.current || waitingForUserRef.current) {
      console.log('Skipping execution - already executing or waiting');
      return;
    }
    if (currentNodeIndex >= nodes.length) {
      console.log('No more nodes to execute');
      return;
    }

    executingRef.current = true;
    setIsProcessing(true);

    const sortedNodes = getSortedNodes();
    const currentNode = sortedNodes[currentNodeIndex];

    console.log('Current node:', currentNode);

    if (!currentNode) {
      console.log('No current node found');
      executingRef.current = false;
      setIsProcessing(false);
      return;
    }

    const skill = currentNode.data.skillId
      ? getSkillById(currentNode.data.skillId)
      : null;

    console.log('Skill:', skill);

    if (!skill) {
      console.log('No skill found for node');
      executingRef.current = false;
      setIsProcessing(false);
      return;
    }

    // Get previous output if there are input edges
    const inputEdges = edges.filter((e) => e.target === currentNode.id);
    let previousOutput = null;
    if (inputEdges.length > 0) {
      const sourceNode = inputEdges[0].source;
      previousOutput = nodeOutputs.get(sourceNode);
    }

    // For first node, ask user for input
    if (currentNodeIndex === 0 && !previousOutput) {
      addMessage({
        role: 'assistant',
        content: `Laten we beginnen met de eerste skill: **${skill.name}**\n\n${skill.description}\n\nWat wil je als input voor deze skill?`,
        nodeId: currentNode.id,
        skillId: skill.id,
      });

      waitingForUserRef.current = true;
      executingRef.current = false;
      setIsProcessing(false);
      return;
    }

    // Build conversation messages for API
    const conversationMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      if (!user?.apiKey) {
        throw new Error('Geen API key gevonden. Log opnieuw in.');
      }

      const response = await fetch('/api/chat-execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': user.apiKey,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          model,
          skillId: skill.id,
          skillDescription: skill.description,
          customPrompt: currentNode.data.customPrompt,
          previousOutput,
          files: currentFilesRef.current.length > 0 ? currentFilesRef.current : undefined,
        }),
      });

      const data = await response.json();

      // Clear files after use
      currentFilesRef.current = [];

      if (data.error) {
        addMessage({
          role: 'assistant',
          content: `❌ Fout bij uitvoeren van skill: ${data.error}`,
          nodeId: currentNode.id,
          skillId: skill.id,
        });

        executingRef.current = false;
        setIsProcessing(false);
        return;
      }

      // Add Claude's response
      addMessage({
        role: 'assistant',
        content: data.content,
        nodeId: currentNode.id,
        skillId: skill.id,
      });

      // Store output
      const newOutputs = new Map(nodeOutputs);
      newOutputs.set(currentNode.id, data.content);
      setNodeOutputs(newOutputs);

      // Move to next node
      setCurrentNodeIndex(currentNodeIndex + 1);

      // If there are more nodes, continue
      if (currentNodeIndex + 1 < sortedNodes.length) {
        const nextNode = sortedNodes[currentNodeIndex + 1];
        const nextSkill = nextNode.data.skillId
          ? getSkillById(nextNode.data.skillId)
          : null;

        if (nextSkill) {
          addMessage({
            role: 'system',
            content: `Volgende skill: **${nextSkill.name}**`,
          });
        }

        // Small delay before next execution
        setTimeout(() => {
          executingRef.current = false;
          setIsProcessing(false);
          executeCurrentSkill();
        }, 500);
      } else {
        // Workflow complete
        addMessage({
          role: 'system',
          content: '✅ Workflow voltooid! Alle skills zijn succesvol uitgevoerd.',
        });

        executingRef.current = false;
        setIsProcessing(false);
      }
    } catch (error: any) {
      addMessage({
        role: 'assistant',
        content: `❌ Fout: ${error.message}`,
        nodeId: currentNode.id,
        skillId: skill.id,
      });

      executingRef.current = false;
      setIsProcessing(false);
    }
  }, [currentNodeIndex, nodes, edges, nodeOutputs, messages, user, model, addMessage, setIsProcessing]);

  // Listen for user input
  useEffect(() => {
    const handleUserInput = (event: any) => {
      console.log('chat-user-input event received', {
        waitingForUser: waitingForUserRef.current,
        detail: event.detail,
      });

      // Store files from the event
      if (event.detail?.files) {
        currentFilesRef.current = event.detail.files;
        console.log('Files stored:', event.detail.files.length);
      }

      if (waitingForUserRef.current) {
        console.log('Setting waitingForUserRef to false and triggering execution');
        waitingForUserRef.current = false;
        // Trigger execution by setting state
        setUserInputReceived(true);
      }
    };

    window.addEventListener('chat-user-input', handleUserInput);
    return () => window.removeEventListener('chat-user-input', handleUserInput);
  }, []);

  // Execute when user input is received
  useEffect(() => {
    if (userInputReceived && !executingRef.current) {
      console.log('Executing skill after user input');
      setUserInputReceived(false);
      setTimeout(() => {
        executeCurrentSkill();
      }, 100);
    }
  }, [userInputReceived, executeCurrentSkill]);

  // Start execution when chat opens
  useEffect(() => {
    console.log('Start execution useEffect triggered', {
      isOpen,
      messagesLength: messages.length,
      currentNodeIndex,
      executing: executingRef.current,
      hasStarted: hasStartedRef.current,
    });

    if (
      isOpen &&
      messages.length > 0 &&
      currentNodeIndex === 0 &&
      !executingRef.current &&
      !hasStartedRef.current
    ) {
      hasStartedRef.current = true;
      // Wait a bit before starting
      console.log('Starting execution after delay...');
      setTimeout(() => {
        executeCurrentSkill();
      }, 1000);
    }
  }, [isOpen, executeCurrentSkill]);

  // Reset when chat closes
  useEffect(() => {
    if (!isOpen) {
      console.log('Resetting chat executor state');
      setCurrentNodeIndex(0);
      setNodeOutputs(new Map());
      setUserInputReceived(false);
      executingRef.current = false;
      waitingForUserRef.current = false;
      hasStartedRef.current = false;
      currentFilesRef.current = [];
    }
  }, [isOpen]);

  return null; // This component doesn't render anything
}
