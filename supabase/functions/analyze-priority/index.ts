import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { title, activityType, subjectName, deadline, weight } = await req.json();

    const systemPrompt = `Você é um assistente acadêmico especializado em avaliar a dificuldade de atividades universitárias.

Analise a atividade e retorne APENAS um JSON válido (sem markdown, sem backticks) com esta estrutura:
{
  "difficulty": "alta" | "media" | "baixa",
  "priority": "alta" | "media" | "baixa",
  "reason": "justificativa curta em 1 frase"
}

Critérios para avaliar dificuldade:
- Provas são geralmente mais difíceis que exercícios
- Seminários exigem preparação significativa
- Conteúdos como cálculo, física, química, programação, estatística são mais difíceis
- Trabalhos com peso alto na nota são mais críticos
- Considere o nome da disciplina para inferir complexidade
- Atividades com prazo curto + alta dificuldade = prioridade alta`;

    const userPrompt = `Atividade: "${title}"
Tipo: ${activityType}
Disciplina: ${subjectName || "não informada"}
Prazo: ${deadline}
Peso: ${weight}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response, handling potential markdown wrapping
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const analysis = JSON.parse(cleanContent);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-priority error:", error);
    // Return a fallback so the app doesn't break
    return new Response(
      JSON.stringify({
        difficulty: "media",
        priority: "media",
        reason: "Análise automática indisponível",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
