import { NextResponse } from 'next/server';
import { setSessionData } from '@/app/api/sessionStore';

// Retrieve LDAP credentials from environment variables
const LDAP_USERNAME = process.env.LDAP_USERNAME;
const LDAP_PASSWORD = process.env.LDAP_PASSWORD;
const EXTERNAL_API_URL = 'https://demo-legal-llm-backend-1.hpc4.aganitha.ai/api/contracts/upload-for-review';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateType = formData.get('template_type') as string;
    const sessionId = formData.get('session_id') as string;

    console.log('Upload For Review - Request received:', {
      sessionId,
      templateType,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });

    if (!file) {
      console.log('Error: File is required');
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (!templateType) {
      console.log('Error: Template type is required');
      return NextResponse.json({ error: 'Template type is required' }, { status: 400 });
    }
    if (!sessionId) {
      console.log('Error: Session ID is required');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Validate LDAP credentials
    if (!LDAP_USERNAME || !LDAP_PASSWORD) {
      console.log('Error: LDAP credentials are missing in environment variables');
      return NextResponse.json({ error: 'LDAP credentials are missing in environment variables' }, { status: 500 });
    }

    // Prepare Basic Auth header
    const authString = `${LDAP_USERNAME}:${LDAP_PASSWORD}`;
    const authHeader = 'Basic ' + Buffer.from(authString).toString('base64');
    console.log('Basic Auth header prepared (redacted for security)');

    // Prepare the form data for the external API
    const externalFormData = new FormData();
    externalFormData.append('file', file);
    externalFormData.append('template_type', templateType);
    externalFormData.append('session_id', sessionId);

    console.log('Uploading review document to external endpoint:', EXTERNAL_API_URL);
    const externalResponse = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: externalFormData,
    });

    const contentType = externalResponse.headers.get('Content-Type');
    let responseData: any;

    if (contentType?.includes('application/json')) {
      responseData = await externalResponse.json();
    } else {
      responseData = { text: await externalResponse.text() };
    }

    console.log('External endpoint response:', {
      status: externalResponse.status,
      ok: externalResponse.ok,
      data: responseData,
      headers: Object.fromEntries(externalResponse.headers.entries()),
    });

    if (!externalResponse.ok) {
      let errorMessage = responseData.error || 'Failed to upload review document to external endpoint';
      if (!contentType?.includes('application/json')) {
        errorMessage = `${errorMessage} (Status: ${externalResponse.status} ${externalResponse.statusText})`;
      }
      console.log('External endpoint error details:', responseData);
      return NextResponse.json(
        { error: errorMessage, details: responseData },
        { status: externalResponse.status }
      );
    }

    console.log('External endpoint success:', responseData);

    // Update the local session store with the filename
    setSessionData(sessionId, { reviewFile: file.name });
    console.log('Upload For Review - Stored in session:', { sessionId, reviewFile: file.name });

    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        session_id: sessionId,
        filename: file.name,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Upload error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}