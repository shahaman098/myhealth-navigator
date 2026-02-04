import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log('Processing health explanation query:', query);

    // Build system prompt for health explanations
    const systemPrompt = `You are a friendly, helpful AI health assistant that explains medical information in plain, simple language. 

Your role:
- Explain medical terms, diagnoses, and procedures in everyday language
- Break down lab results and what they mean for the patient
- Explain medications, their purposes, and how they work
- Provide context about treatments and what to expect
- Use analogies and simple examples to make complex concepts understandable
- Be empathetic, supportive, and reassuring
- Always remind users to consult their healthcare provider for medical advice

Guidelines:
- Avoid medical jargon - use simple, everyday words
- Be concise but thorough
- Use bullet points for clarity
- Include analogies when helpful
- Keep a warm, conversational tone
- Never diagnose or provide medical advice - only explain existing information`;

    // Build user message with context if provided
    let userMessage = query;
    if (context) {
      userMessage = `Context from medical records:\n${JSON.stringify(context, null, 2)}\n\nQuestion: ${query}`;
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
            explanation: null
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI service requires payment. Please contact support.",
            explanation: null
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "I couldn't generate an explanation at this time.";

    console.log('Successfully generated explanation');

    return new Response(
      JSON.stringify({
        success: true,
        explanation,
        query,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in health-explainer function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        explanation: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
