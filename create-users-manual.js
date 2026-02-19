#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // needs admin permissions

if (!supabaseUrl || !serviceRoleKey) {
  console.log('❌ Missing REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const users = [
  { email: 'kavin@company.com', password: 'kavin123', name: 'Kavin', role: 'engineer', location_id: 1 },
  { email: 'arun@company.com', password: 'arun123', name: 'Arun', role: 'engineer', location_id: 2 },
  { email: 'gokul@company.com', password: 'gokul123', name: 'Gokul', role: 'engineer', location_id: 3 },
  { email: 'kathir@company.com', password: 'kathir123', name: 'Kathir', role: 'engineer', location_id: 4 },
  { email: 'manager@company.com', password: 'manager123', name: 'Manager', role: 'manager', location_id: 1 }
];

(async () => {
  try {
    console.log('🧹 Removing demo local auth...');
    // This is local storage in browser; here we just inform the user.
    console.log('   Clear browser localStorage keys: engineerUser, demoAuth');

    console.log('👥 Creating users in Supabase Auth (admin)...');
    for (const u of users) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role }
      });
      if (createErr) {
        console.log(`   ⚠️ ${u.email}: ${createErr.message}`);
        continue;
      }
      const userId = created.user.id;
      const { error: profileErr } = await admin.from('profiles').upsert({
        id: userId,
        name: u.name,
        email: u.email,
        role: u.role,
        location_id: u.location_id,
        phone: '',
        bio: '',
        skills: [],
        certifications: [],
        experience_years: 0,
        avatar: '👤',
        is_available: true,
        is_active: true
      });
      if (profileErr) {
        console.log(`   ⚠️ profile upsert failed for ${u.email}: ${profileErr.message}`);
      } else {
        console.log(`   ✅ ${u.email} created`);
      }
    }
    console.log('✔️ Done. You can now sign in with these users.');
  } catch (e) {
    console.error('❌ Failed:', e.message);
  }
})();
