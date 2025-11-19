import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { encryptApiKey } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is verplicht' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-ant-')) {
      return NextResponse.json(
        { error: 'Ongeldige API key formaat' },
        { status: 400 }
      );
    }

    // Test the API key by making a simple call to Anthropic
    try {
      const anthropic = new Anthropic({ apiKey });

      // Make a minimal test call to verify the key works
      await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      });
    } catch (error: any) {
      console.error('API key validation error:', error);

      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          { error: 'Ongeldige API key. Controleer je Anthropic API key.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error:
            'Kon API key niet valideren. Controleer je internetverbinding.',
        },
        { status: 500 }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Generate user ID (hash of API key for consistent ID)
    const userId = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex')
      .substring(0, 16);

    // Encrypt API key for storage
    const encryptedApiKey = encryptApiKey(apiKey);

    return NextResponse.json({
      success: true,
      userId,
      sessionToken,
      encryptedApiKey,
      message: 'Succesvol ingelogd',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Er is een fout opgetreden tijdens het inloggen',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
