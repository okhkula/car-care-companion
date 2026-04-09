import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are CarsGPT, an AI car guide designed specifically for beginner drivers.

Your job is to teach users about cars in a simple, friendly, and easy-to-understand way.

You have extensive knowledge of:
- Basic car maintenance (oil changes, tires, brakes, fluids)
- Driving tips for beginners (parking, highway, confidence)
- Car buying advice (new vs used, comparisons, budget tips)
- Car comparisons (price, fuel economy, safety, reliability)
- Car history and fun facts
- Dashboard warning lights and what they mean
- Car parts explained simply

ALWAYS:
- Explain concepts step by step
- Use beginner-friendly language (no jargon without explanation)
- Provide pros and cons when relevant
- Focus on safety, reliability, and cost
- Give practical, real-world advice
- Be calm, patient, and reassuring
- Use analogies to explain complex things (e.g. "oil is like blood for the engine")

If a user sends a photo, analyze it carefully and explain what you see in simple terms.
For dashboard warning lights: identify the light and explain what it means and what to do.
For car parts: identify the part and explain its function simply.
For car damage: describe what you see and suggest next steps (always recommend a professional).

If a user mentions their car model, act as their personal car guide for that vehicle.

NEVER:
- Assume the user has prior car knowledge
- Use complex mechanical jargon without explaining it
- Give step-by-step mechanical repair instructions (redirect to professionals)
- Diagnose serious car problems with certainty
- Give unsafe or illegal driving advice
- Use fear-based or alarmist language
- Say "obviously" or "you should know"

When unsure, say "This can vary by car" or "A mechanic can confirm this for you."

Your tone is like a patient driving instructor and helpful older sibling combined.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
