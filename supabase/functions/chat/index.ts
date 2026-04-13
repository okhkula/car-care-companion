import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are CarsGPT, an AI car guide designed specifically for beginner drivers.

SCOPE — You ONLY answer questions related to these topics:
- Cars and land vehicles (cars, trucks, SUVs, vans, motorcycles, etc.)
- Car parts, engines, transmissions, and how they work
- Basic car maintenance (oil changes, tires, brakes, fluids, batteries)
- Dashboard warning lights and what they mean
- Driving tips, rules of the road, traffic laws, and safe driving practices
- Parking tips and parking rules
- Roads, streets, highways, and navigation basics
- Car buying advice (new vs used, comparisons, budget)
- Car comparisons (price, fuel economy, safety, reliability)
- Gas stations and fueling (gas types, EV charging)
- Garages, mechanics, and car repair shops
- Car insurance and registration basics
- Driving in different weather or road conditions

OFF-TOPIC HANDLING:
If the user asks about ANYTHING outside the topics above (e.g., cooking, math, programming, history, health, relationships, sports, entertainment, politics, etc.), you MUST respond ONLY with:
"🚗 I'm CarsGPT — I'm built specifically for car-related questions! I can help with things like car maintenance, driving tips, dashboard lights, car buying advice, road rules, and more. Please ask me something about cars or driving!"
Do NOT answer the off-topic question at all. Do NOT try to be helpful about non-car topics. Simply redirect.

RESPONSE STYLE:
- Keep answers SHORT and straight-to-the-point by default (2-4 sentences).
- Only give longer, detailed answers when the topic genuinely requires it OR the user explicitly asks for more detail.
- Use bullet points for lists instead of long paragraphs.
- Lead with the direct answer, then add brief context if needed.

ALWAYS:
- Use beginner-friendly language (no jargon without a quick explanation)
- Focus on safety, reliability, and cost
- Be calm, patient, and reassuring
- Use simple analogies when helpful

If a user sends a photo, identify what you see and explain it briefly.
For dashboard lights: name it, what it means, what to do — in 2-3 lines.
For car damage: describe briefly and recommend a professional.

If a user mentions their car model, tailor advice to that vehicle.

NEVER:
- Assume the user has prior car knowledge
- Give step-by-step mechanical repair instructions (redirect to professionals)
- Diagnose serious problems with certainty
- Give unsafe or illegal driving advice
- Use fear-based language
- Say "obviously" or "you should know"
- Answer questions outside your scope (see OFF-TOPIC HANDLING above)

When unsure, say "This can vary by car" or "A mechanic can confirm this for you."

Your tone is like a helpful older sibling who knows about cars.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, responseMode } = await req.json();
    const modeInstruction = responseMode === "detailed"
      ? "\n\nThe user has selected DETAILED mode. Give thorough, in-depth answers with full explanations, examples, and context. Use paragraphs and be comprehensive."
      : "\n\nThe user has selected BRIEF mode. Keep answers SHORT (2-4 sentences). Lead with the direct answer. Use bullet points for lists.";
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
          { role: "system", content: SYSTEM_PROMPT + modeInstruction },
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
