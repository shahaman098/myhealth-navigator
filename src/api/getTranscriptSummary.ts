import { supabase } from "@/integrations/supabase/client";

export interface TranscriptSummary {
  summary: string;
  condition: string;
  keyIssues: string[];
  treatments: string[];
  nextSteps: string[];
  raw: string;
  transcript?: string;
}

/**
 * Fetch and summarize a patient transcript using Heidi AI
 */
export const getTranscriptSummary = async (sessionId: string): Promise<TranscriptSummary> => {
  try {
    const { data, error } = await supabase.functions.invoke('heidi-transcript-summary', {
      body: { sessionId }
    });

    if (error) {
      console.error('Error fetching transcript summary:', error);
      throw error;
    }

    return data as TranscriptSummary;
  } catch (error) {
    console.error('Failed to get transcript summary:', error);
    throw error;
  }
};
