import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { decryptApiKey } from '@/lib/encryption';

// Skill-specifieke prompts
const SKILL_PROMPTS: Record<string, (inputs: any) => string> = {
  'pdf-extract': (inputs) => `
Je bent een PDF text extractor. De gebruiker heeft een PDF bestand geüpload.

Bestand: ${inputs.file || 'Geen bestand opgegeven'}
Paginas: ${inputs.pages || 'Alle paginas'}

Geef een JSON response terug met:
{
  "text": "De geëxtraheerde tekst",
  "metadata": {
    "pages": aantal paginas,
    "author": "auteur als beschikbaar",
    "title": "titel als beschikbaar"
  }
}
`,

  'excel-read': (inputs) => `
Je bent een Excel data reader. De gebruiker wil data uit een Excel bestand lezen.

Bestand: ${inputs.file || 'Geen bestand opgegeven'}
Sheet: ${inputs.sheet || 'Standaard sheet'}

Geef een JSON response terug met:
{
  "data": [
    {"kolom1": "waarde1", "kolom2": "waarde2"},
    ...meer rijen...
  ],
  "headers": ["kolom1", "kolom2", ...]
}
`,

  'excel-write': (inputs) => `
Je bent een Excel data writer. De gebruiker wil data naar een Excel bestand schrijven.

Data: ${JSON.stringify(inputs.data || [])}
Bestandsnaam: ${inputs.filename || 'output.xlsx'}
Sheet naam: ${inputs.sheetName || 'Sheet1'}

Geef een JSON response terug met:
{
  "file": "pad naar gegenereerd bestand",
  "success": true,
  "rowCount": aantal geschreven rijen
}
`,

  'text-transform': (inputs) => `
Je bent een text transformer. Transformeer de volgende tekst volgens de gevraagde operatie.

Input tekst: "${inputs.text || ''}"
Operatie: ${inputs.operation || 'trim'}

Mogelijke operaties: uppercase, lowercase, capitalize, trim

Geef een JSON response terug met:
{
  "result": "de getransformeerde tekst"
}
`,

  'data-filter': (inputs) => `
Je bent een data filter. Filter de volgende data op basis van de opgegeven criteria.

Data: ${JSON.stringify(inputs.data || [])}
Filter op veld: ${inputs.filterKey}
Filter waarde: ${inputs.filterValue}

Filter de data array en behoud alleen items waar het opgegeven veld gelijk is aan de filter waarde.

Geef een JSON response terug met:
{
  "filtered": [gefilterde items]
}
`,

  'json-parse': (inputs) => `
Je bent een JSON parser. Parse de volgende JSON string naar een object.

JSON string: ${inputs.jsonString || '{}'}

Geef een JSON response terug met:
{
  "data": het geparsede JSON object,
  "valid": true/false of de JSON geldig was
}
`,
};

export async function POST(request: NextRequest) {
  try {
    const { skillId, inputs } = await request.json();

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is verplicht' },
        { status: 400 }
      );
    }

    // Get encrypted API key from Authorization header
    const encryptedApiKey = request.headers.get('X-API-Key');

    if (!encryptedApiKey) {
      return NextResponse.json(
        { error: 'Geen API key gevonden. Log opnieuw in.' },
        { status: 401 }
      );
    }

    // Decrypt API key
    let apiKey: string;
    try {
      apiKey = decryptApiKey(encryptedApiKey);
    } catch (error) {
      return NextResponse.json(
        { error: 'Ongeldige API key. Log opnieuw in.' },
        { status: 401 }
      );
    }

    // Get skill prompt
    const promptGenerator = SKILL_PROMPTS[skillId];
    if (!promptGenerator) {
      return NextResponse.json(
        { error: `Onbekende skill: ${skillId}` },
        { status: 400 }
      );
    }

    const prompt = promptGenerator(inputs);

    // Create Anthropic client with user's API key
    const anthropic = new Anthropic({ apiKey });

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract response text
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Try to parse as JSON
    let output;
    try {
      // Extract JSON from response if it's wrapped in markdown code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/)
        || responseText.match(/```\n([\s\S]*?)\n```/)
        || [null, responseText];

      output = JSON.parse(jsonMatch[1] || responseText);
    } catch (e) {
      // If not JSON, return as text
      output = {
        success: true,
        result: responseText,
      };
    }

    return NextResponse.json({
      skillId,
      inputs,
      output,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Skill execution error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Er is een fout opgetreden bij het uitvoeren van de skill',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
