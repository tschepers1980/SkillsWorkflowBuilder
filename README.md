# Claude Skills Workflow Builder

Een interactieve webtool om workflows te bouwen met Claude Code skills.

## Features

🔐 **Secure Authentication** - Log in met je eigen Anthropic API key
✅ **Drag & Drop Interface** - Sleep skills van de sidebar naar de canvas
✅ **Visual Node Connections** - Verbind skills om data flow te creëren
✅ **Chat-based Workflow Execution** - Interactieve workflow uitvoering via chat met Claude
✅ **Custom Skill Prompts** - Configureer begeleidings-prompts per skill
✅ **Workflow Settings** - Stel startprompt en Claude model in per workflow
✅ **Node Inspector** - Bekijk en configureer node details
✅ **Save & Load Workflows** - Sla je workflows op in localStorage
✅ **Export Workflows** - Exporteer workflows als JSON
✅ **Dual Execution Modes** - Kies tussen snelle execution of chat-based execution
✅ **Real-time Execution Status** - Zie live updates van skill executies
✅ **Skill Categories** - Filter skills op categorie
✅ **Personal API Key Usage** - Elke gebruiker gebruikt zijn eigen Claude API key
✅ **Encrypted Storage** - API keys worden veilig versleuteld opgeslagen

## Beschikbare Skills

### Document Processing
- **PDF Extract** - Extract text en data uit PDF bestanden

### Data Processing
- **Excel Lezen** - Lees data uit Excel/CSV bestanden
- **Excel Schrijven** - Schrijf data naar Excel bestand
- **Data Filteren** - Filter data op basis van condities
- **JSON Parsen** - Parse JSON string naar object

### Text Processing
- **Tekst Transformeren** - Transformeer en manipuleer tekst data

## Hoe te Gebruiken

### 1. Inloggen
- Bij het openen van de applicatie zie je een login scherm
- Voer je Anthropic API key in (begint met `sk-ant-`)
- Je API key wordt veilig versleuteld en lokaal opgeslagen
- Heb je nog geen API key? [Maak er een aan](https://console.anthropic.com/)

### 2. Skills Toevoegen
- Sleep een skill van de sidebar naar de canvas
- De skill verschijnt als een node op de canvas

### 3. Nodes Verbinden
- Klik op de groene cirkel (output) van een node
- Sleep naar de blauwe cirkel (input) van een andere node
- De data flow wordt nu gevisualiseerd

### 4. Node Configureren
- Klik op een node om de inspector te openen
- Voeg een custom begeleidings-prompt toe voor deze skill
- De prompt wordt gebruikt om Claude te begeleiden bij het uitvoeren van deze specifieke skill

### 5. Workflow Instellingen
- Klik op "Instellingen" in de toolbar
- Kies het Claude model (Haiku, Sonnet of Opus)
- Voeg een optionele workflow startprompt toe
- Deze context wordt gebruikt voor alle skills in de workflow

### 6. Workflow Opslaan & Laden
- **Opslaan:** Klik op "Opslaan", geef een naam en beschrijving
- **Laden:** Klik op "Laden" en selecteer een opgeslagen workflow
- **Exporteren:** Download je workflow als JSON bestand

### 7. Workflow Uitvoeren

Er zijn twee manieren om een workflow uit te voeren:

#### A. Snel Uitvoeren (Zonder Chat)
- Klik op "Snel Uitvoeren" in de toolbar
- Alle skills worden automatisch uitgevoerd
- Resultaten worden getoond in het rechter panel

#### B. Chat Uitvoeren (Interactief)
- Klik op "Chat Uitvoeren" in de toolbar
- Een chat window opent zich
- Claude begeleidt je stap-voor-stap door de workflow:
  1. Voor de eerste skill vraagt Claude om input
  2. Elke skill wordt uitgevoerd met de output van de vorige skill
  3. Je kunt tijdens de executie met Claude communiceren
  4. Skills met custom prompts krijgen extra begeleiding
- De workflow wordt automatisch doorgegeven van skill naar skill
- Aan het einde zie je de output van de laatste skill

## Getting Started

### 1. Installeer Dependencies

```bash
npm install
```

### 2. Configureer Environment Variabelen

Maak een `.env.local` bestand in de root van het project:

```bash
cp .env.example .env.local
```

Configureer de volgende variabelen in `.env.local`:

```bash
# Encryption Secret (VERPLICHT!)
# Genereer een sterke random string voor productie
ENCRYPTION_SECRET=verander-dit-naar-een-sterke-random-string

# Optional: Fallback API key (niet nodig met auth systeem)
ANTHROPIC_API_KEY=your-fallback-key-here
```

**Belangrijke security opmerking:**
- De `ENCRYPTION_SECRET` wordt gebruikt om user API keys veilig te versleutelen
- Genereer een sterke random string: `openssl rand -hex 32`
- **Verander deze NOOIT in productie** - anders kunnen users niet meer inloggen!

Je kunt een API key krijgen van [Anthropic Console](https://console.anthropic.com/).

### 3. Start de Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Build voor Productie

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** - React framework met App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ReactFlow** - Workflow canvas en node management
- **Zustand** - State management
- **Anthropic Claude API** - AI-powered skill execution
- **Lucide React** - Icons

## Project Structuur

```
claude-skills-workflow/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts    # API route voor authenticatie
│   │   ├── chat-execute/       # API route voor chat-based execution
│   │   │   └── route.ts
│   │   └── execute-skill/      # API route voor snelle execution
│   │       └── route.ts
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page met workflow builder
├── components/
│   ├── chat-window.tsx             # Chat interface voor interactieve execution
│   ├── execution-panel.tsx         # Panel met execution results
│   ├── login-screen.tsx            # Login scherm voor authenticatie
│   ├── node-inspector.tsx          # Inspector voor node configuratie
│   ├── protected-route.tsx         # Auth wrapper voor protected content
│   ├── skill-node.tsx              # Custom skill node component
│   ├── skills-sidebar.tsx          # Sidebar met beschikbare skills
│   ├── workflow-canvas.tsx         # ReactFlow canvas
│   ├── workflow-chat-executor.tsx  # Chat-based workflow executor
│   └── workflow-toolbar.tsx        # Toolbar met save/load/execute
├── lib/
│   ├── auth-store.ts       # Zustand store voor authenticatie state
│   ├── chat-store.ts       # Zustand store voor chat state
│   ├── encryption.ts       # Utilities voor API key encryptie
│   ├── skill-registry.ts   # Registry van beschikbare skills
│   └── workflow-store.ts   # Zustand store voor workflow state management
├── types/
│   └── skills.ts           # TypeScript types en interfaces
├── .env.local              # Environment variabelen (niet in git)
└── .env.example            # Example environment variabelen
```

## Toekomstige Uitbreidingen

- [x] Claude API integratie voor skill execution
- [x] Real-time workflow execution met live output
- [x] Chat-based interactive execution
- [x] Custom skill prompts per node
- [x] Workflow startprompt en model configuratie
- [x] Node inspector voor configuratie
- [x] User authenticatie met eigen API key
- [x] Veilige encryptie van API keys
- [ ] File upload support voor PDF/Excel skills
- [ ] Workflow templates library
- [ ] Collaborative editing
- [ ] Workflow versioning
- [ ] Import workflows van JSON
- [ ] Custom skill creation met AI prompt builder
- [ ] Workflow debugging tools
- [ ] Performance analytics
- [ ] Skill parameter validation
- [ ] Conditional branching in workflows
- [ ] Loop/iteration support
- [ ] Conversation history export
- [ ] Multi-user workflows
