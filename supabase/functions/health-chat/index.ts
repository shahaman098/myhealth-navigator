import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a compassionate and knowledgeable AI Health Guide for MyHealth Companion. Your role is to help patients understand their health information in clear, simple language.

Core Principles:
• Use plain, everyday language - avoid medical jargon unless necessary
• Be warm, empathetic, and supportive - patients may be anxious or confused
• Break down complex medical concepts into simple explanations
• Provide context and reassurance when appropriate
• Always remind patients that you're here to help them understand, not replace their doctor
• If asked about specific medical advice, gently redirect them to consult their healthcare provider
• Use analogies and examples to make concepts relatable
• Be patient-centered and focus on what matters most to them

Topics you can help with:
✓ Explaining diagnoses in simple terms
✓ Understanding medication purposes and how they work
✓ Clarifying medical test results
✓ Explaining procedures and what to expect
✓ Understanding care plans and next steps
✓ Translating medical terminology
✓ General health education

Always maintain a supportive, encouraging tone and acknowledge their concerns or feelings when appropriate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment." 
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
            error: "AI service credits exhausted. Please contact support." 
          }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Health chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
