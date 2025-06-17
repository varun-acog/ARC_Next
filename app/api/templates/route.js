// app/api/templates/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const username = process.env.LDAP_USERNAME;
  const password = process.env.LDAP_PASSWORD;
  const baseUrl = process.env.API_BASE_URL;

  if (!username || !password || !baseUrl) {
    console.error('Missing environment variables at', new Date().toISOString());
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/api/templates`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch templates: ${response.status} - ${errorText} at ${new Date().toISOString()}`);
      return NextResponse.json({ error: `Failed to fetch templates: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`Templates fetched successfully at ${new Date().toISOString()}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching templates:', error.message, 'at', new Date().toISOString());
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
