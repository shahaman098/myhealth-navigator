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
  note?: string;
}

interface SessionEncounter {
  id: string;
  note?: string;
  reasonForVisit?: string;
  diagnosis?: string;
  plan?: string;
  findings?: string;
  procedures?: string;
  summary?: string;
}

interface SessionData {
  id: string;
  patientId: string;
  encounters?: SessionEncounter[];
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
  console.log(`Fetching from Heidi API: ${endpoint}`);
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Heidi API error: ${response.status} - ${errorText}`);
    throw new Error(`Heidi API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Send message to Heidi Ask-AI
 */
async function askHeidiAI(
  systemPrompt: string,
  userPrompt: string,
  token: string,
  baseUrl: string
): Promise<string> {
  console.log('Creating Heidi AI conversation...');
  
  // Create conversation
  const conversationResponse = await fetch(`${baseUrl}/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Patient Transcript Analysis'
    })
  });

  if (!conversationResponse.ok) {
    throw new Error(`Failed to create conversation: ${conversationResponse.status}`);
  }

  const conversation = await conversationResponse.json();
  const conversationId = conversation.id || conversation.conversationId;

  console.log(`Conversation created: ${conversationId}`);

  // Send system message first (if API supports it)
  // Then send user message with full prompt
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  const messageResponse = await fetch(`${baseUrl}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: fullPrompt
    })
  });

  if (!messageResponse.ok) {
    throw new Error(`Failed to send message: ${messageResponse.status}`);
  }

  const messageData = await messageResponse.json();
  console.log('AI response received');
  
  return messageData.response || messageData.content || messageData.message || '';
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(rawResponse: string): {
  summary: string;
  condition: string;
  keyIssues: string[];
  nextSteps: string[];
  clinicalBrief: string;
} {
  // Try to extract structured information from the response
  const lines = rawResponse.split('\n').filter(line => line.trim());
  
  let summary = '';
  let condition = '';
  const keyIssues: string[] = [];
  const nextSteps: string[] = [];
  let clinicalBrief = '';
  
  let currentSection = '';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.includes('summary') || lower.includes('brief summary')) {
      currentSection = 'summary';
      continue;
    } else if (lower.includes('condition') || lower.includes('current patient condition')) {
      currentSection = 'condition';
      continue;
    } else if (lower.includes('key') && (lower.includes('issue') || lower.includes('clinical'))) {
      currentSection = 'keyIssues';
      continue;
    } else if (lower.includes('next') || lower.includes('expect') || lower.includes('follow')) {
      currentSection = 'nextSteps';
      continue;
    } else if (lower.includes('clinical') && lower.includes('brief')) {
      currentSection = 'clinicalBrief';
      continue;
    }
    
    // Add content to appropriate section
    if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
      const content = line.replace(/^[-•*]\s*/, '').trim();
      if (currentSection === 'keyIssues') {
        keyIssues.push(content);
      } else if (currentSection === 'nextSteps') {
        nextSteps.push(content);
      }
    } else if (line.trim()) {
      if (currentSection === 'summary') {
        summary += line.trim() + ' ';
      } else if (currentSection === 'condition') {
        condition += line.trim() + ' ';
      } else if (currentSection === 'clinicalBrief') {
        clinicalBrief += line.trim() + ' ';
      }
    }
  }
  
  // Fallback if parsing fails
  if (!summary && !condition) {
    const paragraphs = rawResponse.split('\n\n');
    summary = paragraphs[0] || rawResponse.slice(0, 300);
    condition = paragraphs[1] || 'See full response for details';
  }
  
  return {
    summary: summary.trim() || 'No summary available',
    condition: condition.trim() || 'No condition summary available',
    keyIssues: keyIssues.length > 0 ? keyIssues : ['See transcript for details'],
    nextSteps: nextSteps.length > 0 ? nextSteps : ['Follow up as recommended'],
    clinicalBrief: clinicalBrief.trim() || summary.trim()
  };
}

/**
 * Build consult note from encounter data
 */
function buildConsultNote(encounter: SessionEncounter | undefined): string {
  if (!encounter) {
    return 'No consult note available';
  }
  
  const parts: string[] = [];
  
  if (encounter.reasonForVisit) {
    parts.push(`Reason for Visit: ${encounter.reasonForVisit}`);
  }
  if (encounter.diagnosis) {
    parts.push(`Diagnosis: ${encounter.diagnosis}`);
  }
  if (encounter.findings) {
    parts.push(`Findings: ${encounter.findings}`);
  }
  if (encounter.plan) {
    parts.push(`Plan: ${encounter.plan}`);
  }
  if (encounter.procedures) {
    parts.push(`Procedures: ${encounter.procedures}`);
  }
  if (encounter.note) {
    parts.push(`Note: ${encounter.note}`);
  }
  if (encounter.summary) {
    parts.push(`Summary: ${encounter.summary}`);
  }
  
  return parts.length > 0 ? parts.join('\n\n') : 'No consult note details available';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing transcript for session: ${sessionId}`);

    // Get environment variables
    const HEIDI_API_URL = Deno.env.get('HEIDI_API_URL');
    const HEIDI_API_KEY = Deno.env.get('HEIDI_API_KEY');
    const HEIDI_JWT_SECRET = Deno.env.get('HEIDI_JWT_SECRET');

    if (!HEIDI_API_URL || !HEIDI_API_KEY || !HEIDI_JWT_SECRET) {
      throw new Error('Missing Heidi API configuration');
    }

    // Generate JWT token
    const token = await generateHeidiJWT(HEIDI_API_KEY, HEIDI_JWT_SECRET);

    // Fetch notes and session data in parallel
    const [notesData, sessionData] = await Promise.all([
      fetchHeidiData(`/patient-sessions/${sessionId}/notes`, token, HEIDI_API_URL).catch(err => {
        console.error('Error fetching notes:', err);
        return { notes: [] };
      }),
      fetchHeidiData(`/patient-sessions/${sessionId}`, token, HEIDI_API_URL).catch(err => {
        console.error('Error fetching session:', err);
        return { encounters: [] };
      })
    ]);

    const notes: TranscriptNote[] = notesData.notes || notesData || [];
    const session: SessionData = sessionData;

    console.log(`Found ${notes.length} notes`);

    // Build transcript from all notes (sorted chronologically)
    const sortedNotes = notes.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const transcriptText = sortedNotes
      .map(note => {
        const date = new Date(note.createdAt).toLocaleString();
        const type = note.type ? `[${note.type}]` : '';
        const content = note.content || note.note || '';
        return `${date} ${type}\n${content}`;
      })
      .join('\n\n---\n\n');

    // Build consult note from first encounter
    const firstEncounter = session.encounters?.[0];
    const consultNoteText = buildConsultNote(firstEncounter);

    console.log('Sending to AI for analysis...');

    // System prompt
    const systemPrompt = `You are a clinical assistant. Given the patient transcript and consult note, produce:

- A brief medical summary
- Current condition (plain language)
- Key issues (bulleted)
- What the patient should know next
- Clinical interpretation (simple language)

Avoid jargon unless necessary. Be accurate but supportive.`;

    // User prompt with both transcript and consult note
    const userPrompt = `Here is the patient's full transcript and consult note. Please summarise:
- What happened
- The condition
- Key findings
- What the patient should expect next

Transcript:
${transcriptText || 'No transcript available'}

Consult Note:
${consultNoteText}`;

    // Get AI summary
    const aiResponse = await askHeidiAI(
      systemPrompt,
      userPrompt,
      token,
      HEIDI_API_URL
    );

    // Parse AI response
    const aiSummary = parseAIResponse(aiResponse);

    // Return structured response
    const response = {
      transcript: transcriptText || 'No transcript available',
      consultNote: consultNoteText,
      aiSummary,
      rawAIResponse: aiResponse
    };

    console.log('Successfully processed transcript');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in heidi-transcript function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        transcript: 'Error fetching transcript',
        consultNote: 'Error fetching consult note',
        aiSummary: {
          summary: 'Unable to process transcript at this time',
          condition: 'Service temporarily unavailable',
          keyIssues: ['Please try again later'],
          nextSteps: ['Contact support if issue persists'],
          clinicalBrief: 'Service error'
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
