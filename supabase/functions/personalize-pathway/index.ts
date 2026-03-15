import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-sonnet-4-20250514';

function hashProfile(profile: Record<string, unknown>): string {
  const key = JSON.stringify({
    age: profile.age,
    partner_status: profile.partner_status,
    goal: profile.goal,
    journey_stage: profile.journey_stage,
    risks: profile.risks,
    had_consultation: profile.had_consultation,
    amh: profile.amh,
    afc: profile.afc,
  });
  let h = key.length;
  for (let i = 0; i < key.length; i += 7) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function buildPrompt(profile: Record<string, unknown>, nodes: unknown[]): string {
  const stageLabels: Record<string, string> = {
    researching: 'just starting to research',
    pre_consultation: 'pre-consultation (looking for a specialist)',
    post_consultation: "post-consultation (deciding next steps)",
    mid_cycle: "mid-cycle (currently stimming)",
    post_retrieval: "post-retrieval (figuring out what's next)",
    transfer: 'preparing for or have done a transfer',
  };

  const goalLabels: Record<string, string> = {
    future_flexibility: 'keeping options open for the future',
    live_birth: 'having one child',
    multiple_births: 'having more than one child',
  };

  const partnerLabels: Record<string, string> = {
    male_partner: 'has a biologically male partner',
    non_male_partner: 'has a partner who is not biologically male',
    no_partner: 'does not have a partner',
  };

  const profileSummary = [
    `Age: ${profile.age}`,
    profile.location ? `Location: ${profile.location}` : null,
    `Partner status: ${partnerLabels[profile.partner_status as string] || profile.partner_status}`,
    `Goal: ${goalLabels[profile.goal as string] || profile.goal}`,
    `Journey stage: ${stageLabels[profile.journey_stage as string] || profile.journey_stage}`,
    profile.had_consultation != null
      ? `Had RE consultation: ${profile.had_consultation ? 'Yes' : 'Not yet'}`
      : null,
    profile.amh ? `AMH: ${profile.amh} ng/mL` : null,
    profile.afc ? `AFC (antral follicle count): ${profile.afc}` : null,
    profile.risks && (profile.risks as string[]).length > 0
      ? `Known risk factors: ${(profile.risks as string[]).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are a compassionate fertility navigator helping a woman understand her egg freezing journey based on her personal profile and real community data.

USER PROFILE:
${profileSummary}

CANONICAL PATHWAY (nodes extracted from real community posts):
${JSON.stringify(nodes, null, 2)}

Generate a personalized pathway analysis. Be warm, practical, and honest. Base everything on the community data provided.

Return a JSON object with this exact schema:
{
  "headline": "<8-12 word personalized headline for her situation>",
  "summary": "<2-3 sentence overview of what her journey will likely look like, specific to her profile>",
  "next_step": "<single most important concrete action she should take RIGHT NOW>",
  "confidence": <0.0-1.0>,
  "confidence_note": "<1 sentence explaining the confidence level>",
  "node_notes": {
    "<node_id as string>": "<personalized 1-2 sentence note for this node>"
  },
  "choice_recommendations": {
    "<node_id as string>": {
      "recommended_option": "<label of the option most relevant to her>",
      "reasoning": "<1-2 sentences why>",
      "confidence": <0.0-1.0>
    }
  },
  "watch_outs": ["<specific watch out given her profile>"],
  "questions_for_re": ["<question she should ask her RE>"]
}

Rules:
- node_notes: 3-6 most relevant nodes only
- watch_outs: 2-4 items specific to her profile
- questions_for_re: 3-5 questions
- If no male partner, omit anything about partner sperm/testing

Return ONLY the JSON object. No other text.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  console.log('Request received, auth header present:', !!authHeader, 'starts with Bearer:', authHeader?.startsWith('Bearer '));

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user via anon client with their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found', detail: profileError?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache
    const profileHash = hashProfile(profile);
    const { data: cached } = await supabase
      .from('personalized_pathways')
      .select('pathway, profile_hash')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cached && cached.profile_hash === profileHash) {
      return new Response(JSON.stringify(cached.pathway), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch canonical pathway
    const { data: journeyRow, error: journeyError } = await supabase
      .from('journeys')
      .select('nodes')
      .eq('journey_type', 'egg-freezing')
      .maybeSingle();

    if (journeyError || !journeyRow) {
      return new Response(JSON.stringify({ error: 'Pathway data not found', detail: journeyError?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Claude via fetch (no SDK dependency)
    const prompt = buildPrompt(profile, journeyRow.nodes);
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      return new Response(JSON.stringify({ error: 'Claude API error', detail: errBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeRes.json();
    let raw = claudeData.content[0].text.trim();
    if (raw.startsWith('```')) {
      raw = raw.split('```')[1];
      if (raw.startsWith('json')) raw = raw.slice(4);
    }

    let personalization: Record<string, unknown>;
    try {
      personalization = JSON.parse(raw.trim());
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to parse Claude response', detail: raw }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache result
    await supabase.from('personalized_pathways').upsert(
      {
        user_id: user.id,
        pathway: personalization,
        profile_hash: profileHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return new Response(JSON.stringify(personalization), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
