import { NextResponse } from 'next/server';

// Retrieve LDAP credentials from environment variables
const LDAP_USERNAME = process.env.LDAP_USERNAME;
const LDAP_PASSWORD = process.env.LDAP_PASSWORD;

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.formData();
    const sessionId = body.get('session_id') as string;

    console.log('Evaluate - Session ID:', sessionId);

    // Validate session_id
    if (!sessionId) {
      console.log('Error: Session ID is required');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Validate LDAP credentials
    if (!LDAP_USERNAME || !LDAP_PASSWORD) {
      console.log('Error: LDAP credentials are missing in environment variables');
      return NextResponse.json(
        { error: 'LDAP credentials are missing in environment variables' },
        { status: 500 }
      );
    }

    // Prepare Basic Auth header: Base64 encode "username:password"
    const authString = `${LDAP_USERNAME}:${LDAP_PASSWORD}`;
    const authHeader = 'Basic ' + Buffer.from(authString).toString('base64');
    console.log('Basic Auth header prepared (redacted for security)');

    // Prepare the request body for the external API
    const externalBody = new URLSearchParams();
    externalBody.append('session_id', sessionId);
    console.log('External request body:', externalBody.toString());

    console.log('Sending evaluation request to external endpoint...');
    const externalResponse = await fetch(
      'https://demo-legal-llm-backend-1.hpc4.aganitha.ai/api/contracts/evaluate',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
        body: externalBody,
      }
    );

    console.log('External endpoint response status:', externalResponse.status);
    const responseBody = await externalResponse.text();
    console.log('External endpoint response body:', responseBody);

    if (!externalResponse.ok) {
      const contentType = externalResponse.headers.get('Content-Type');
      let errorMessage = 'Failed to evaluate contract via external endpoint';
      let errorData = {};
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = JSON.parse(responseBody);
          errorMessage = errorData.error || errorData.detail || 'External API returned an error with no details';
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError.message);
          errorMessage = 'Invalid error response from external API';
        }
      } else {
        errorMessage = `${errorMessage} (Status: ${externalResponse.status} ${externalResponse.statusText})`;
      }
      console.log('External endpoint error details:', errorData);
      console.log('External endpoint error:', errorMessage);
      return NextResponse.json(
        { error: errorMessage, details: errorData },
        { status: externalResponse.status }
      );
    }

    let responseData;
    try {
      responseData = JSON.parse(responseBody);
    } catch (parseError) {
      console.error('Failed to parse external response as JSON:', parseError.message);
      return NextResponse.json({ error: 'Invalid response from external API' }, { status: 500 });
    }
    console.log('External endpoint parsed response:', responseData);

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Evaluation error:', error.message);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}