import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('Gemini AI Chatbot API Endpoint', () => {
  it('returns 400 with requiresApiKey when no API key is provided', async () => {
    const mockRequest = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the top cartoon CTR in INR?' }],
      }),
    });

    const res = await POST(mockRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.requiresApiKey).toBe(true);
    expect(json.error).toContain('Gemini API Key missing');
  });

  it('rejects empty message history', async () => {
    const mockRequest = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        apiKey: 'dummy-key',
      }),
    });

    const res = await POST(mockRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('No message history');
  });
});
