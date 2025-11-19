# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Setup

**CRITICAL**: Before running the app, create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

**Required environment variables:**
- `ENCRYPTION_SECRET`: Used to encrypt user API keys. Generate with `openssl rand -hex 32`. **Never change in production** or users cannot decrypt their stored keys.
- `ANTHROPIC_API_KEY`: Optional fallback key (users provide their own keys via login)

## Architecture Overview

### Core Concept

This is a **visual workflow builder** for Claude AI skills. Users drag skills onto a canvas, connect them in sequence, and execute workflows either via:
1. **Quick Execute**: Batch execution with results panel
2. **Chat Execute**: Interactive step-by-step execution with Claude conversation

### Key Architectural Patterns

#### 1. Dual Execution Modes

**Quick Execute** (`workflow-store.ts:executeWorkflow`):
- Topological sort of nodes for correct execution order
- Batch API calls to `/api/execute-skill`
- Updates node status (`running`, `success`, `error`)
- Stores results in `executionResults` Map

**Chat Execute** (`workflow-chat-executor.tsx`):
- Step-by-step execution component (renders nothing, pure logic)
- State-based event system: `chat-user-input` CustomEvent triggers next skill
- Uses refs to avoid closure issues: `executingRef`, `waitingForUserRef`, `hasStartedRef`, `currentFilesRef`
- API calls to `/api/chat-execute` with conversation history
- **CRITICAL**: Event listener has empty dependency array to prevent stale closures; uses `userInputReceived` state to trigger execution

#### 2. State Management (Zustand)

Three separate stores with distinct responsibilities:

**`auth-store.ts`**:
- User authentication with encrypted API keys
- Stores encrypted key in localStorage via Zustand persist
- Login validates key with test API call

**`workflow-store.ts`**:
- ReactFlow nodes/edges management
- Workflow save/load to localStorage
- Quick execution logic with topological sorting
- Helper function `getEncryptedApiKey()` reads from auth store

**`chat-store.ts`**:
- Chat messages array
- Chat window open/close state
- Model selection (Haiku 4.5, Sonnet 4.5, Opus 4.1)
- Processing state

#### 3. Security: API Key Encryption

**Flow:**
1. User enters API key in `login-screen.tsx`
2. Backend (`/api/auth/login`) validates with test call
3. Backend encrypts key with AES-256-CBC (`lib/encryption.ts`)
4. Encrypted key stored in frontend localStorage
5. All API calls send encrypted key in `X-API-Key` header
6. Backend routes decrypt before calling Anthropic API

**CRITICAL**: If `ENCRYPTION_SECRET` changes, all existing encrypted keys become invalid.

#### 4. Document Upload (PDF/Files)

**Client-side** (`chat-window.tsx`):
- Files converted to base64 via FileReader
- Sent in CustomEvent with `{ message, files: [{ name, type, size, base64 }] }`

**Executor** (`workflow-chat-executor.tsx`):
- Stores files in `currentFilesRef` from event
- Passes to API in body: `{ files: [...] }`

**Backend** (`/api/chat-execute`):
- Converts to Anthropic document format:
```typescript
{
  type: 'document',
  source: {
    type: 'base64',
    media_type: 'application/pdf',
    data: base64_string
  }
}
```
- Combines with text in multi-part message content array

#### 5. ReactFlow Canvas Integration

**Custom Node Component** (`skill-node.tsx`):
- Displays skill name, icon, status
- Handles for input/output connections
- Visual status indicators (running animation, success/error colors)

**Canvas** (`workflow-canvas.tsx`):
- ReactFlow wrapper with custom node types
- Drag & drop from sidebar creates new nodes
- Node selection opens inspector

**Node Inspector** (`node-inspector.tsx`):
- Slide-in panel for selected node
- Edit custom prompt per skill (used in chat execution)

### Skill System

**Registry** (`lib/skill-registry.ts`):
- Array of `SkillDefinition` objects
- Each skill has: id, name, description, category, inputs, outputs
- Skills are **declarative** - actual execution happens in API routes

**Backend Execution** (`/api/execute-skill` and `/api/chat-execute`):
- Routes contain skill-specific prompts as `SKILL_PROMPTS` object
- Prompt templates define Claude's behavior for each skill
- Chat execution uses conversational style; quick execution uses structured JSON output

### Model IDs

**Current supported models** (defined in `types/skills.ts`):
- `claude-haiku-4-5-20251001` (default - fast & cheap)
- `claude-sonnet-4-5-20250929` (balanced)
- `claude-opus-4-1-20250805` (most capable)

**Update locations when adding new models:**
1. `types/skills.ts`: ClaudeModel type
2. `components/chat-window.tsx`: MODEL_LABELS
3. `lib/chat-store.ts`: default model
4. `lib/workflow-store.ts`: default workflowModel

### Event System (Chat Execution)

**Custom events used:**
- `chat-user-input`: Dispatched from `chat-window.tsx` when user sends message
  - Payload: `{ detail: { message: string, files: FileData[] } }`
  - Listened by `workflow-chat-executor.tsx`

**Why event-based?**
- Decouples UI (chat-window) from execution logic (executor)
- Executor doesn't render, only handles workflow progression
- Avoids prop drilling through multiple components

## Common Debugging Scenarios

### Chat Execution Not Working

**Symptoms:** Duplicate messages, no API calls
**Check:**
1. Browser console for debug logs: `executeCurrentSkill called`, `chat-user-input event received`
2. Server logs for `POST /api/chat-execute`
3. Verify `waitingForUserRef` is set true after initial message
4. Verify `userInputReceived` state triggers execution useEffect

**Common causes:**
- Stale closures in event listener (fixed by empty dependency array)
- Missing state trigger after event
- `executingRef` not properly cleared

### File Upload Not Received by API

**Check:**
1. Browser console: `Files stored: [count]` log
2. Verify base64 conversion completed (await Promise.all)
3. Check `currentFilesRef` populated in executor
4. Verify API route receives `files` in request body
5. Check document format in Anthropic API call

### Authentication Issues

**Check:**
1. `.env.local` has `ENCRYPTION_SECRET` set
2. API key format starts with `sk-ant-`
3. Test call succeeds in `/api/auth/login`
4. Encrypted key stored in localStorage under `auth-storage`
5. Decryption succeeds in API routes

## Code Patterns to Follow

### Adding New Skills

1. Add to `lib/skill-registry.ts`:
```typescript
{
  id: 'new-skill',
  name: 'Display Name',
  description: 'What it does',
  category: 'Category',
  icon: 'LucideIconName',
  inputs: [...],
  outputs: [...]
}
```

2. Add prompt to API routes (`/api/execute-skill` and `/api/chat-execute`):
```typescript
SKILL_PROMPTS['new-skill'] = (inputs) => `...prompt template...`;
```

### State Updates in Workflow Execution

Always use Zustand setters, never mutate state:
```typescript
// ✅ Good
setNodeOutputs(new Map(nodeOutputs).set(id, value));

// ❌ Bad
nodeOutputs.set(id, value);
```

### ReactFlow Node Updates

Use `updateNodeData` from workflow-store:
```typescript
updateNodeData(nodeId, { status: 'running' });
```

This internally maps and immutably updates the nodes array.

## Critical Files for Workflow Execution

- `components/workflow-chat-executor.tsx`: Chat execution logic
- `lib/workflow-store.ts`: Quick execution + workflow state
- `app/api/chat-execute/route.ts`: Backend for chat execution
- `app/api/execute-skill/route.ts`: Backend for quick execution
- `lib/skill-registry.ts`: Skill definitions

## Known Limitations

- Workflows stored in localStorage (not persisted to backend)
- No workflow versioning or conflict resolution
- File uploads converted to base64 (memory intensive for large files)
- No circular dependency protection beyond topological sort
- Single workflow execution at a time per chat session
