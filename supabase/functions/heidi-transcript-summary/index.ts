import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptNote {
  id: string;
  content: string;
  createdAt: string;
  type?: string;
}

interface SessionData {
  id: string;
  patientId: string;
  allergies?: any[];
  medications?: any[];
  encounters?: any[];
  demographics?: any;
}

/**
 * Generate JWT token for Heidi API authentication
 */
async function generateHeidiJWT(apiKey: string, secret: string): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: apiKey,
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  // Use Web Crypto API for HMAC
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureData = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signatureInput)
  );
  
  const signatureArray = new Uint8Array(signatureData);
  const signature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * Fetch data from Heidi API
 */
async function fetchHeidiData(endpoint: string, token: string, baseUrl: string): Promise<any> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Heidi API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Send message to Heidi Ask-AI
 */
async function askHeidiAI(
  prompt: string,
  token: string,
  baseUrl: string
): Promise<string> {
  // Create conversation
  const conversationResponse = await fetch(`${baseUrl}/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Patient Transcript Summary'
    })
  });

  if (!conversationResponse.ok) {
    throw new Error(`Failed to create conversation: ${conversationResponse.status}`);
  }

  const conversation = await conversationResponse.json();
  const conversationId = conversation.id || conversation.conversationId;

  // Send message
  const messageResponse = await fetch(`${baseUrl}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: prompt
    })
  });

  if (!messageResponse.ok) {
    throw new Error(`Failed to send message: ${messageResponse.status}`);
  }

  const messageData = await messageResponse.json();
  return messageData.response || messageData.content || messageData.message || '';
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(rawResponse: string): {
  summary: string;
  condition: string;
  keyIssues: string[];
  treatments: string[];
  nextSteps: string[];
} {
  const lines = rawResponse.split('\n').filter(line => line.trim());
  
  let summary = '';
  let condition = '';
  const keyIssues: string[] = [];
  const treatments: string[] = [];
  const nextSteps: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.includes('brief summary')) {
      currentSection = 'summary';
      continue;
    } else if (lower.includes('current patient condition')) {
      currentSection = 'condition';
      continue;
    } else if (lower.includes('key clinical issues')) {
      currentSection = 'keyIssues';
      continue;
    } else if (lower.includes('treatments') || lower.includes('medications')) {
      currentSection = 'treatments';
      continue;
    } else if (lower.includes('expect next') || lower.includes('next steps')) {
      currentSection = 'nextSteps';
      continue;
    }
    
    const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
    if (!cleanLine) continue;
    
    switch (currentSection) {
      case 'summary':
        summary += cleanLine + ' ';
        break;
      case 'condition':
        condition += cleanLine + ' ';
        break;
      case 'keyIssues':
        if (cleanLine) keyIssues.push(cleanLine);
        break;
      case 'treatments':
        if (cleanLine) treatments.push(cleanLine);
        break;
      case 'nextSteps':
        if (cleanLine) nextSteps.push(cleanLine);
        break;
    }
  }
  
  return {
    summary: summary.trim() || 'No summary available',
    condition: condition.trim() || 'No condition information available',
    keyIssues: keyIssues.length > 0 ? keyIssues : ['No key issues identified'],
    treatments: treatments.length > 0 ? treatments : ['No treatments recorded'],
    nextSteps: nextSteps.length > 0 ? nextSteps : ['Follow up as recommended by your healthcare provider']
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    // Get environment variables
    const apiKey = Deno.env.get('HEIDI_API_KEY');
    const secret = Deno.env.get('HEIDI_JWT_SECRET');
    const baseUrl = Deno.env.get('HEIDI_API_URL') || 'https://api.heidi.health';

    if (!apiKey || !secret) {
      throw new Error('Missing Heidi API credentials');
    }

    console.log('Generating JWT token...');
    const token = await generateHeidiJWT(apiKey, secret);

    console.log('Fetching session notes...');
    // Fetch notes
    const notesData = await fetchHeidiData(
      `/patient-sessions/${sessionId}/notes`,
      token,
      baseUrl
    );

    console.log('Fetching session data...');
    // Fetch session data for context
    const sessionData = await fetchHeidiData(
      `/patient-sessions/${sessionId}`,
      token,
      baseUrl
    );

    // Build comprehensive transcript
    let transcript = '';

    // Add session context
    if (sessionData.demographics) {
      transcript += `Patient Demographics:\n${JSON.stringify(sessionData.demographics, null, 2)}\n\n`;
    }

    if (sessionData.allergies && sessionData.allergies.length > 0) {
      transcript += `Allergies: ${sessionData.allergies.join(', ')}\n\n`;
    }

    if (sessionData.medications && sessionData.medications.length > 0) {
      transcript += `Current Medications: ${sessionData.medications.map((m: any) => m.name || m).join(', ')}\n\n`;
    }

    // Add notes chronologically
    const notes = Array.isArray(notesData) ? notesData : notesData.notes || [];
    transcript += 'Clinical Notes:\n\n';
    notes.forEach((note: TranscriptNote) => {
      transcript += `[${note.createdAt || 'Date unknown'}] ${note.type || 'Note'}:\n${note.content}\n\n`;
    });

    console.log('Sending to Heidi AI...');
    // Prepare AI prompt
    const systemPrompt = `You are a clinical assistant designed to summarise a patient's full longitudinal transcript.
Your goal is to extract only medically meaningful information and present it in a clear,
patient-friendly manner.

Generate:

Brief Summary: (2–3 sentences)

Current Patient Condition: plain language

Key Clinical Issues: bullet points

Treatments & Medications: simple explanation

What the Patient Should Expect Next: reassurance + clarity

If applicable: red flags or follow-up recommendations (gentle, non-alarming)

Avoid medical jargon unless necessary, and always explain it.`;

    const userPrompt = `Here is the full transcript for the patient session.
Please summarise the entire session and brief the patient's current condition.

Transcript:
${transcript}`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Get AI response
    const aiResponse = await askHeidiAI(fullPrompt, token, baseUrl);
    console.log('AI Response received');

    // Parse response
    const parsed = parseAIResponse(aiResponse);

    return new Response(
      JSON.stringify({
        ...parsed,
        raw: aiResponse,
        transcript: transcript
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in heidi-transcript-summary:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        summary: 'Unable to generate summary',
        condition: 'Error processing transcript',
        keyIssues: ['Error retrieving information'],
        treatments: ['Error retrieving information'],
        nextSteps: ['Please try again or contact support']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
