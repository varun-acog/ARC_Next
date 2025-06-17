// app/api/contracts/generate/route.js
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
  const formData = await request.formData();
  const fields = {};
  for (const [key, value] of formData.entries()) {
    fields[key] = value;
  }

  console.log('Request body to /api/contracts/generate:', fields);

  const { enterprise_name, client_name, effective_date, valid_duration, notice_period, template_type, session_id } = fields;

  if (!enterprise_name || !client_name || !effective_date || !valid_duration || !notice_period || !template_type || !session_id) {
    console.error('Missing required fields in request:', { enterprise_name, client_name, effective_date, valid_duration, notice_period, template_type, session_id });
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const formBody = new URLSearchParams(fields).toString();

  try {
    const response = await fetch(`${baseUrl}/api/contracts/generate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Expect a .docx file
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Contract generation failed:', response.status, errorData, 'at', new Date().toISOString());
      return NextResponse.json({ error: errorData.error || 'Failed to generate contract', details: errorData }, { status: response.status });
    }

    const buffer = await response.arrayBuffer(); // Get the raw binary data
    console.log('Contract generated for session', session_id, 'at', new Date().toISOString());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="contract.docx"',
      },
    });
  } catch (error) {
    console.error('Error generating contract:', error.message, 'at', new Date().toISOString());
    return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
  }
}