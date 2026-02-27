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

    const { messages, subjects, activities, academicStatus } = await req.json();

    const dayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Build subject context with full schedules
    let subjectContext = '';
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      subjectContext = `\n\nMatérias do aluno:\n${subjects.map((s: any) => {
        const scheduleStr = s.schedules && Array.isArray(s.schedules) && s.schedules.length > 0
          ? s.schedules.map((sch: any) => `${dayLabels[sch.day]} ${sch.startTime}-${sch.endTime}`).join(', ')
          : 'sem horário definido';
        return `- ${s.name} (${s.type}, prof. ${s.professor || 'N/A'}, sala: ${s.location || 'N/A'}, horários: ${scheduleStr}, carga: ${s.workload}h)`;
      }).join('\n')}`;
    }

    // Build activities context
    let activitiesContext = '';
    if (activities && Array.isArray(activities) && activities.length > 0) {
      const subjectMap: Record<string, string> = {};
      if (subjects) subjects.forEach((s: any) => { subjectMap[s.id || ''] = s.name; });
      
      const pending = activities.filter((a: any) => a.status !== 'concluido');
      const completed = activities.filter((a: any) => a.status === 'concluido');
      
      if (pending.length > 0) {
        activitiesContext += `\n\nAtividades pendentes (${pending.length}):\n${pending.map((a: any) => {
          const typeLabel = { prova: 'Prova', trabalho: 'Trabalho', seminario: 'Seminário', exercicio: 'Exercício' }[a.activityType] || a.activityType;
          return `- [${typeLabel}] ${a.title} — prazo: ${a.deadline?.split('T')[0]} — prioridade: ${a.priority} — matéria: ${subjectMap[a.subjectId] || 'N/A'}`;
        }).join('\n')}`;
      }
      
      if (completed.length > 0) {
        activitiesContext += `\n\nAtividades concluídas recentes (${completed.length}):\n${completed.slice(0, 10).map((a: any) => {
          const typeLabel = { prova: 'Prova', trabalho: 'Trabalho', seminario: 'Seminário', exercicio: 'Exercício' }[a.activityType] || a.activityType;
          const gradeStr = a.grade != null ? ` — nota: ${a.grade}` : '';
          return `- [${typeLabel}] ${a.title}${gradeStr} — peso: ${a.weight ?? 1} — matéria: ${subjectMap[a.subjectId] || 'N/A'}`;
        }).join('\n')}`;
      }
    }

    // Build academic status context
    const isCalouro = academicStatus === 'calouro';
    const statusContext = isCalouro
      ? `\n\nO aluno é CALOURO (primeiro período ou recém-chegado na universidade). Adapte suas respostas:
- Explique conceitos com mais detalhes e paciência
- Use analogias simples para facilitar o entendimento
- Dê dicas sobre a vida universitária (como funciona CR, reprovação, trancamento)
- Seja mais encorajador e acolhedor, ele ainda está se adaptando
- Sugira técnicas básicas de estudo (Pomodoro, mapas mentais, revisão espaçada)
- Alerte sobre armadilhas comuns de calouros (deixar matéria acumular, faltar demais)`
      : `\n\nO aluno é VETERANO (já tem experiência na universidade). Adapte suas respostas:
- Seja mais direto e técnico nas explicações
- Foque em estratégias avançadas de estudo e otimização de tempo
- Pode usar termos acadêmicos sem simplificar tanto
- Dê dicas sobre TCC, estágio, monitoria e oportunidades
- Ajude com gestão de carga pesada de matérias
- Sugira conexões entre disciplinas e visão mais ampla do curso`;

    // Build today context
    const now = new Date();
    const todayLabel = dayLabels[now.getDay()];
    const todayContext = `\n\nHoje é ${todayLabel}, ${now.toISOString().split('T')[0]}.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Você é o Haki — o mentor de estudos do Study Hakify. Você NÃO é professor. Você é o "amigo inteligente que salva do caos acadêmico".

Seus papéis: Mentor, Organizador, Conselheiro, Motivador e Alerta inteligente.

Tom de voz:
- Inteligente e claro
- Levemente descontraído (nunca infantil, nunca formal demais)
- Direto ao ponto, como um colega que manja do assunto

Exemplos de como você fala:
- "Boa! Você já concluiu 3 tarefas hoje. 🔥"
- "Atenção 👀 Sua frequência caiu para 74%."
- "Se quiser, posso organizar suas prioridades da semana."
- "Precisa saber quanto tirar na próxima prova?"

Regras:
- Responda sempre em português brasileiro
- Use exemplos práticos quando possível
- Se o aluno não especificar a matéria, pergunte
- Use markdown para formatar (negrito, listas, etc)
- Seja encorajador mas honesto
- Mantenha respostas concisas (máx 300 palavras) a menos que peçam detalhes
- Use emojis com moderação pra dar leveza
- Quando perguntarem sobre aulas de um dia específico, consulte os horários das matérias e responda com precisão (dia, horário, sala, professor)
- Quando perguntarem sobre provas/trabalhos, consulte as atividades pendentes e concluídas
- Se perguntarem sobre notas, use os dados de atividades concluídas com nota${todayContext}${subjectContext}${activitiesContext}${statusContext}`,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("study-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
