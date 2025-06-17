import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const LDAP_USERNAME = process.env.LDAP_USERNAME;
  const LDAP_PASSWORD = process.env.LDAP_PASSWORD;
  const BASE_URL = 'https://demo-legal-llm-backend-1.hpc4.aganitha.ai';

  if (!LDAP_USERNAME || !LDAP_PASSWORD) {
    console.error('Missing LDAP credentials at', new Date().toISOString());
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const auth = Buffer.from(`${LDAP_USERNAME}:${LDAP_PASSWORD}`).toString('base64');

  try {
    const formData = await request.formData();
    const sessionId = formData.get('session_id') as string;

    if (!sessionId) {
      console.error('Session ID is required at', new Date().toISOString());
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const evaluateBody = new URLSearchParams();
    evaluateBody.append('session_id', sessionId);

    const response = await fetch(`${BASE_URL}/api/contracts/evaluate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: evaluateBody,
    });

    if (!response.ok) {
      const contentType = response.headers.get('Content-Type');
      let errorMessage = 'Failed to evaluate contract';
      let errorData: { error?: string; [key: string]: any } = {};

      if (contentType?.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        errorMessage = `${errorMessage} (Status: ${response.status} ${response.statusText})`;
      }

      console.error(`Evaluation failed: ${errorMessage} at ${new Date().toISOString()}`);
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log(`Contract evaluated successfully for session ${sessionId} at ${new Date().toISOString()}`);
    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    console.error('Error evaluating contract:', err.message, 'at', new Date().toISOString());
    return NextResponse.json({ error: 'Failed to evaluate contract' }, { status: 500 });
  }
}