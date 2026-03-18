import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: callerError } = await anonClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: callerProfile } = await adminClient
      .from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, name, role, location_id, resend } = await req.json();

    if (!email || !name || !role) {
      return new Response(JSON.stringify({ error: 'email, name, and role are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resend) {
      // Resend: re-invite unaccepted user
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { name, role, location_id }
      });
      if (inviteError) {
        if (inviteError.message?.includes('already registered') ||
            inviteError.message?.includes('already been registered')) {
          return new Response(JSON.stringify({ error: 'User has already activated their account' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw inviteError;
      }
      const now = new Date().toISOString();
      await adminClient.from('profiles').update({ invite_sent_at: now }).eq('email', email);
      await adminClient.from('engineers').update({ invite_sent_at: now }).eq('email', email);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // New invite
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { data: { name, role, location_id } }
    );
    if (inviteError) throw inviteError;

    const userId = inviteData.user.id;
    const now = new Date().toISOString();

    // Insert into profiles
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId, name, email, role,
      location_id: location_id || null,
      is_active: false, is_approved: false,
      invite_sent_at: now,
      created_at: now, updated_at: now,
    });
    if (profileError) throw profileError;

    // Insert into engineers
    const { error: engineerError } = await adminClient.from('engineers').insert({
      id: userId, name, email, role,
      location_id: location_id || null,
      is_active: false, is_approved: false,
      invite_sent_at: now,
      is_available: true,
      created_at: now, updated_at: now,
    });
    if (engineerError) throw engineerError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('invite-user error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
