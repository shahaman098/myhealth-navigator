import { supabase } from "@/integrations/supabase/client";

/**
 * AI query response types
 */
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a query to the AI Health Guide via Edge Function
 * Supports contextual health information explanations
 */
export const sendAIQuery = async (
  messages: AIMessage[],
  context?: any
): Promise<string> => {
  try {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    const { data, error } = await supabase.functions.invoke('health-explainer', {
      body: {
        query: lastUserMessage,
        context: context
      }
    });
    
    if (error) {
      console.error('Error calling AI explainer:', error);
      throw error;
    }

    return data?.explanation || "I couldn't generate an explanation at this time. Please try again.";
  } catch (error) {
    console.error('Failed to get AI explanation:', error);
    return "I'm having trouble connecting to the AI service right now. Please try again in a moment.";
  }
};
