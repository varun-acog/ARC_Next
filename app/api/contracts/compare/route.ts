import { NextResponse } from 'next/server';

// Retrieve LDAP credentials from environment variables
const LDAP_USERNAME = process.env.LDAP_USERNAME;
const LDAP_PASSWORD = process.env.LDAP_PASSWORD;

export async function POST(request: Request) {
  try {
    console.log('Handling compare request...');
    const body = await request.formData();
    const sessionId = body.get('session_id') as string;

    console.log('Compare - Session ID:', sessionId);
    if (!sessionId) {
      console.log('Error: Session ID is required');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Validate LDAP credentials
    if (!LDAP_USERNAME || !LDAP_PASSWORD) {
      console.log('Error: LDAP credentials are missing in environment variables');
      return NextResponse.json({ error: 'LDAP credentials are missing in environment variables' }, { status: 500 });
    }

    // Prepare Basic Auth header: Base64 encode "username:password"
    const authString = `${LDAP_USERNAME}:${LDAP_PASSWORD}`;
    const authHeader = 'Basic ' + Buffer.from(authString).toString('base64');
    console.log('Basic Auth header prepared (redacted for security)');

    // Step 1: Check session status before comparison
    console.log('Checking session status...');
    const statusResponse = await fetch(`https://demo-legal-llm-backend-1.hpc4.aganitha.ai/api/session/${sessionId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
    });

    console.log('Session status response status:', statusResponse.status);
    if (!statusResponse.ok) {
      const contentType = statusResponse.headers.get('Content-Type');
      let errorMessage = 'Failed to check session status';
      let errorData: { error?: string; [key: string]: any } = {};
      if (contentType && contentType.includes('application/json')) {
        errorData = await statusResponse.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        errorMessage = `${errorMessage} (Status: ${statusResponse.status} ${statusResponse.statusText})`;
      }
      console.log('Session status error details:', errorData);
      console.log('Session status error:', errorMessage);
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: statusResponse.status });
    }

    const sessionStatus = await statusResponse.json();
    console.log('Session status:', sessionStatus);

    // Verify that the session has both documents and is ready for comparison
    if (!sessionStatus.has_reference_doc || !sessionStatus.has_review_doc) {
      console.log('Error: Session is not ready for comparison - missing documents');
      return NextResponse.json({ error: 'Session is not ready for comparison - missing reference or review document' }, { status: 400 });
    }

    // Step 2: Proceed with comparison
    console.log('Calling external endpoint to compare documents...');
    const compareBody = new URLSearchParams();
    compareBody.append('session_id', sessionId);

    const externalResponse = await fetch('https://demo-legal-llm-backend-1.hpc4.aganitha.ai/api/contracts/compare', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: compareBody,
    });

    console.log('External endpoint response status:', externalResponse.status);
    if (!externalResponse.ok) {
      const contentType = externalResponse.headers.get('Content-Type');
      let errorMessage = 'Failed to compare documents via external endpoint';
      let errorData: { error?: string; [key: string]: any } = {};
      if (contentType && contentType.includes('application/json')) {
        errorData = await externalResponse.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        errorMessage = `${errorMessage} (Status: ${externalResponse.status} ${externalResponse.statusText})`;
      }
      console.log('External endpoint error details:', errorData);
      console.log('External endpoint error:', errorMessage);
      return NextResponse.json({ error: errorMessage, details: errorData }, { status: externalResponse.status });
    }

    const compareResult = await externalResponse.json();
    console.log('External endpoint comparison result:', compareResult);

    // Return the external endpoint's response directly to the frontend
    return NextResponse.json(compareResult, { status: 200 });
  } catch (error: any) {
    console.error('Compare error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
