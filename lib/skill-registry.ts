import { SkillDefinition } from '@/types/skills';

// Registry van beschikbare Claude Code Skills
export const SKILL_REGISTRY: SkillDefinition[] = [
  {
    id: 'pdf-extract',
    name: 'PDF Extract',
    description: 'Extract text en data uit PDF bestanden',
    category: 'Document Processing',
    icon: 'FileText',
    inputs: [
      {
        name: 'file',
        type: 'file',
        description: 'PDF bestand om te verwerken',
        required: true,
      },
      {
        name: 'pages',
        type: 'string',
        description: 'Welke paginas te extraheren (bijv. "1-3,5")',
        required: false,
      },
    ],
    outputs: [
      {
        name: 'text',
        type: 'string',
        description: 'Geëxtraheerde tekst uit PDF',
      },
      {
        name: 'metadata',
        type: 'object',
        description: 'PDF metadata (auteur, datum, etc.)',
      },
    ],
  },
  {
    id: 'excel-read',
    name: 'Excel Lezen',
    description: 'Lees data uit Excel/CSV bestanden',
    category: 'Data Processing',
    icon: 'Table',
    inputs: [
      {
        name: 'file',
        type: 'file',
        description: 'Excel of CSV bestand',
        required: true,
      },
      {
        name: 'sheet',
        type: 'string',
        description: 'Naam van het werkblad (optioneel)',
        required: false,
      },
    ],
    outputs: [
      {
        name: 'data',
        type: 'array',
        description: 'Array van rijen met data',
      },
      {
        name: 'headers',
        type: 'array',
        description: 'Kolomnamen',
      },
    ],
  },
  {
    id: 'excel-write',
    name: 'Excel Schrijven',
    description: 'Schrijf data naar Excel bestand',
    category: 'Data Processing',
    icon: 'FileSpreadsheet',
    inputs: [
      {
        name: 'data',
        type: 'array',
        description: 'Data om te schrijven',
        required: true,
      },
      {
        name: 'filename',
        type: 'string',
        description: 'Naam van het output bestand',
        required: true,
      },
      {
        name: 'sheetName',
        type: 'string',
        description: 'Naam van het werkblad',
        required: false,
        default: 'Sheet1',
      },
    ],
    outputs: [
      {
        name: 'file',
        type: 'file',
        description: 'Gegenereerd Excel bestand',
      },
    ],
  },
  {
    id: 'text-transform',
    name: 'Tekst Transformeren',
    description: 'Transformeer en manipuleer tekst data',
    category: 'Text Processing',
    icon: 'Type',
    inputs: [
      {
        name: 'text',
        type: 'string',
        description: 'Input tekst',
        required: true,
      },
      {
        name: 'operation',
        type: 'string',
        description: 'Operatie: uppercase, lowercase, capitalize, trim',
        required: true,
        default: 'trim',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'string',
        description: 'Getransformeerde tekst',
      },
    ],
  },
  {
    id: 'data-filter',
    name: 'Data Filteren',
    description: 'Filter data op basis van condities',
    category: 'Data Processing',
    icon: 'Filter',
    inputs: [
      {
        name: 'data',
        type: 'array',
        description: 'Input data array',
        required: true,
      },
      {
        name: 'filterKey',
        type: 'string',
        description: 'Veld om op te filteren',
        required: true,
      },
      {
        name: 'filterValue',
        type: 'string',
        description: 'Waarde om op te filteren',
        required: true,
      },
    ],
    outputs: [
      {
        name: 'filtered',
        type: 'array',
        description: 'Gefilterde data',
      },
    ],
  },
  {
    id: 'json-parse',
    name: 'JSON Parsen',
    description: 'Parse JSON string naar object',
    category: 'Data Processing',
    icon: 'Braces',
    inputs: [
      {
        name: 'jsonString',
        type: 'string',
        description: 'JSON string om te parsen',
        required: true,
      },
    ],
    outputs: [
      {
        name: 'data',
        type: 'object',
        description: 'Geparsed JSON object',
      },
    ],
  },
];

// Helper functies
export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find(skill => skill.id === id);
}

export function getSkillsByCategory(category: string): SkillDefinition[] {
  return SKILL_REGISTRY.filter(skill => skill.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(SKILL_REGISTRY.map(skill => skill.category)));
}
