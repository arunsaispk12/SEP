import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { hospital, contact, phone, description, preferredDate } = await req.json();

    if (!hospital || !contact || !phone || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: config } = await adminClient
      .from('automation_config').select('inbound_email').eq('id', 1).single();

    const inboundEmail = config?.inbound_email;
    if (!inboundEmail) {
      return new Response(JSON.stringify({ error: 'Automation not configured. Contact your administrator.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailBody = `Hospital: ${hospital}
Location: (not specified)
Priority: medium
Date: ${preferredDate || 'Not specified'}

${description}

---
Contact: ${contact}
Phone: ${phone}`;

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@resend.dev',
        to: inboundEmail,
        subject: `[SEP Request] ${hospital}`,
        text: emailBody,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    await adminClient.from('automation_logs').insert({
      type: 'form_submission',
      source: 'form',
      payload: { hospital, contact, phone },
      result: 'created',
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('submit-client-request error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
