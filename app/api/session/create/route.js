// app/api/session/create/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const username = process.env.LDAP_USERNAME;
  const password = process.env.LDAP_PASSWORD;
  const baseUrl = process.env.API_BASE_URL;

  if (!username || !password || !baseUrl) {
    console.error('Missing environment variables at', new Date().toISOString());
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/api/session/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Session creation failed: ${response.status} - ${errorText} at ${new Date().toISOString()}`);
      return NextResponse.json({ error: `Failed to create session: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`Session created: ${data.session_id} at ${new Date().toISOString()}`);
    return NextResponse.json({ session_id: data.session_id });
  } catch (error) {
    console.error('Error creating session:', error.message, 'at', new Date().toISOString());
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}