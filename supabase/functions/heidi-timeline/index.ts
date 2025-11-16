import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimelineEvent {
  id: string;
  type: 'appointment' | 'medication' | 'encounter' | 'treatment' | 'note';
  title: string;
  date: string;
  time?: string;
  description?: string;
  provider?: string;
  status?: string;
  details?: string;
}

// Generate JWT token for Heidi API
async function generateHeidiJWT(apiKey: string, secret: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      apiKey,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    };

    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '');
    const signatureInput = `${headerB64}.${payloadB64}`;

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signatureInput)
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureB64 = btoa(String.fromCharCode(...signatureArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${signatureInput}.${signatureB64}`;
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Failed to generate JWT token');
  }
}

// Fetch data from Heidi API
async function fetchHeidiData(endpoint: string, token: string, baseUrl: string): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Heidi API error (${endpoint}):`, response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Convert Heidi session data to timeline events
function convertToTimelineEvents(sessionData: any): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Process appointments
  if (sessionData.appointments?.length) {
    sessionData.appointments.forEach((apt: any) => {
      events.push({
        id: apt.id || crypto.randomUUID(),
        type: 'appointment',
        title: apt.title || 'Medical Appointment',
        date: apt.date || new Date().toISOString(),
        time: apt.time,
        description: apt.description,
        provider: apt.provider,
        status: apt.status || 'scheduled',
        details: apt.notes,
      });
    });
  }

  // Process encounters
  if (sessionData.encounters?.length) {
    sessionData.encounters.forEach((enc: any) => {
      events.push({
        id: enc.id || crypto.randomUUID(),
        type: 'encounter',
        title: enc.type || 'Medical Encounter',
        date: enc.date || new Date().toISOString(),
        time: enc.time,
        description: enc.summary,
        provider: enc.provider,
        status: 'completed',
        details: enc.details,
      });
    });
  }

  // Process medications
  if (sessionData.medications?.length) {
    sessionData.medications.forEach((med: any) => {
      events.push({
        id: med.id || crypto.randomUUID(),
        type: 'medication',
        title: `Started ${med.name}`,
        date: med.startDate || new Date().toISOString(),
        time: med.time,
        description: med.description || `${med.dosage} - ${med.frequency}`,
        provider: med.prescriber,
        status: med.status || 'ongoing',
        details: med.instructions,
      });
    });
  }

  // Process treatments
  if (sessionData.treatments?.length) {
    sessionData.treatments.forEach((treat: any) => {
      events.push({
        id: treat.id || crypto.randomUUID(),
        type: 'treatment',
        title: treat.name || 'Treatment Session',
        date: treat.date || new Date().toISOString(),
        time: treat.time,
        description: treat.description,
        provider: treat.provider,
        status: treat.status || 'completed',
        details: treat.notes,
      });
    });
  }

  // Process clinical notes
  if (sessionData.notes?.length) {
    sessionData.notes.forEach((note: any) => {
      events.push({
        id: note.id || crypto.randomUUID(),
        type: 'note',
        title: note.title || 'Clinical Note',
        date: note.date || new Date().toISOString(),
        description: note.summary,
        provider: note.author,
        status: 'completed',
        details: note.content,
      });
    });
  }

  // Sort by date (newest first)
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HEIDI_API_KEY = Deno.env.get('HEIDI_API_KEY');
    const HEIDI_API_URL = Deno.env.get('HEIDI_API_URL');
    const HEIDI_JWT_SECRET = Deno.env.get('HEIDI_JWT_SECRET');

    if (!HEIDI_API_KEY || !HEIDI_API_URL || !HEIDI_JWT_SECRET) {
      throw new Error('Missing required Heidi API credentials');
    }

    console.log('Generating JWT token for Heidi API...');
    const jwtToken = await generateHeidiJWT(HEIDI_API_KEY, HEIDI_JWT_SECRET);

    console.log('Fetching session data from Heidi API...');
    // Fetch all session data in parallel
    const [appointments, encounters, medications, treatments, notes] = await Promise.all([
      fetchHeidiData('/sessions/appointments', jwtToken, HEIDI_API_URL),
      fetchHeidiData('/sessions/encounters', jwtToken, HEIDI_API_URL),
      fetchHeidiData('/sessions/medications', jwtToken, HEIDI_API_URL),
      fetchHeidiData('/sessions/treatments', jwtToken, HEIDI_API_URL),
      fetchHeidiData('/sessions/notes', jwtToken, HEIDI_API_URL),
    ]);

    // Merge all session data
    const sessionData = {
      appointments: appointments?.data || [],
      encounters: encounters?.data || [],
      medications: medications?.data || [],
      treatments: treatments?.data || [],
      notes: notes?.data || [],
    };

    console.log('Converting to timeline events...');
    const timeline = convertToTimelineEvents(sessionData);

    console.log(`Successfully generated timeline with ${timeline.length} events`);

    return new Response(JSON.stringify({ 
      success: true,
      timeline,
      metadata: {
        totalEvents: timeline.length,
        fetchedAt: new Date().toISOString(),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in heidi-timeline function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timeline: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
