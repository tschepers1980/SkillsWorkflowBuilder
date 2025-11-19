import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { decryptApiKey } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      model = 'claude-3-5-haiku-20241022',
      skillId,
      skillDescription,
      customPrompt,
      previousOutput,
      files,
    } = await request.json();

    // Get encrypted API key from header
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

    // Build system prompt
    let systemPrompt = '';

    if (skillDescription) {
      systemPrompt += `Je bent een AI assistent die helpt bij het uitvoeren van een skill in een workflow.\n\n`;
      systemPrompt += `**Huidige Skill:** ${skillDescription}\n\n`;
    }

    if (previousOutput) {
      systemPrompt += `**Input van vorige skill:**\n${JSON.stringify(previousOutput, null, 2)}\n\n`;
    }

    if (customPrompt) {
      systemPrompt += `**Speciale instructies voor deze skill:**\n${customPrompt}\n\n`;
    }

    systemPrompt += `Je taak is om:
1. Als dit de eerste skill is: Vraag de gebruiker om de benodigde input
2. Als er input is van een vorige skill: Verwerk deze input volgens de skill beschrijving
3. Geef duidelijke en bruikbare output die doorgegeven kan worden aan de volgende skill
4. Wees conversationeel en behulpzaam

Geef je antwoord in een duidelijk formaat dat makkelijk te begrijpen is.`;

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg: any, index: number) => {
      const isLastMessage = index === messages.length - 1;
      const role = msg.role === 'system' ? 'user' : msg.role;

      // If this is the last user message and there are files, add them as document blocks
      if (isLastMessage && role === 'user' && files && files.length > 0) {
        const content: any[] = [];

        // Add documents first
        for (const file of files) {
          content.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: file.type || 'application/pdf',
              data: file.base64,
            },
          });
        }

        // Add text content
        content.push({
          type: 'text',
          text: msg.content,
        });

        return { role, content };
      }

      // Regular message
      return {
        role,
        content: msg.content,
      };
    });

    // Create Anthropic client with user's API key
    const anthropic = new Anthropic({ apiKey });

    // Call Claude API
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Extract response
    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      content: assistantMessage,
      model,
      skillId,
    });
  } catch (error: any) {
    console.error('Chat execution error:', error);
    return NextResponse.json(
      {
        error:
          error.message ||
          'Er is een fout opgetreden bij het communiceren met Claude',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
