import { supabase } from '@/integrations/supabase/client';

export interface TranscriptResponse {
  transcript: string;
  consultNote: string;
  aiSummary: {
    summary: string;
    condition: string;
    keyIssues: string[];
    nextSteps: string[];
    clinicalBrief: string;
  };
  rawAIResponse: string;
}

export async function getTranscript(sessionId: string): Promise<TranscriptResponse> {
  const { data, error } = await supabase.functions.invoke('heidi-transcript', {
    body: { sessionId }
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch transcript');
  }

  return data as TranscriptResponse;
}
