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
    // Parse email payload (supports Mailgun form-data and Postmark JSON)
    let sender = '', subject = '', bodyPlain = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json();
      sender = json.From || json.from || '';
      subject = json.Subject || json.subject || '';
      bodyPlain = json.TextBody || json.body_plain || json.text || '';
    } else {
      const formData = await req.formData();
      sender = formData.get('sender') as string || formData.get('from') as string || '';
      subject = formData.get('subject') as string || '';
      bodyPlain = formData.get('body-plain') as string || formData.get('stripped-text') as string || '';
    }

    // Fetch config
    const { data: config } = await adminClient
      .from('automation_config').select('*').eq('id', 1).single();

    // Check allowed senders
    const allowed: string[] = config?.allowed_senders || [];
    if (allowed.length > 0) {
      const senderLower = sender.toLowerCase();
      const isAllowed = allowed.some(rule =>
        rule.startsWith('@')
          ? senderLower.endsWith(rule.toLowerCase())
          : senderLower === rule.toLowerCase()
      );
      if (!isAllowed) {
        await adminClient.from('automation_logs').insert({
          type: 'email_case', source: sender, result: 'rejected',
          payload: { subject }, error: 'Sender not in allowlist'
        });
        return new Response(JSON.stringify({ ok: true, result: 'rejected' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Parse body fields
    const getField = (body: string, field: string) => {
      const regex = new RegExp(`^${field}:\\s*(.+)$`, 'mi');
      return body.match(regex)?.[1]?.trim() || null;
    };

    const hospitalName = getField(bodyPlain, 'Hospital');
    const locationName = getField(bodyPlain, 'Location');
    const priorityRaw = getField(bodyPlain, 'Priority');
    const dateRaw = getField(bodyPlain, 'Date');
    const caseTitle = subject.replace(/^\[SEP Request\]\s*/i, '').trim() || 'New Service Request';

    // Resolve client_id
    let client_id = null;
    if (hospitalName) {
      const { data: client } = await adminClient
        .from('clients').select('id').ilike('name', hospitalName).limit(1).single();
      client_id = client?.id || null;
    }

    // Resolve location_id
    let location_id = null;
    if (locationName) {
      const { data: loc } = await adminClient
        .from('locations').select('id').ilike('name', `%${locationName}%`).limit(1).single();
      location_id = loc?.id || null;
    }

    const priority = ['low', 'medium', 'high'].includes(priorityRaw?.toLowerCase() || '')
      ? priorityRaw!.toLowerCase()
      : (config?.default_priority || 'medium');

    // Insert case
    const { data: newCase, error: caseError } = await adminClient
      .from('cases')
      .insert({
        title: caseTitle,
        description: bodyPlain,
        client_id,
        location_id,
        priority,
        status: 'open',
        scheduled_start: dateRaw ? new Date(dateRaw).toISOString() : null,
        created_by: null,
      })
      .select().single();

    if (caseError) throw caseError;

    await adminClient.from('automation_logs').insert({
      type: 'email_case', source: sender, result: 'created',
      payload: { subject, case_id: newCase.id }
    });

    return new Response(JSON.stringify({ ok: true, case_id: newCase.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('parse-email-case error:', err);
    await adminClient.from('automation_logs').insert({
      type: 'email_case', result: 'failed', error: err.message
    }).catch(() => {});
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
