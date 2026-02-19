#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Please configure your Supabase credentials in .env file first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dropAndRecreateSchema() {
  console.log('🚀 Dropping and recreating Supabase database schema...\n');

  try {
    // First, drop all tables and related objects
    console.log('🗑️  Dropping existing tables and objects...');

    const dropStatements = [
      // Drop triggers first
      'DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;',
      'DROP TRIGGER IF EXISTS handle_cases_updated_at ON public.cases;',
      'DROP TRIGGER IF EXISTS handle_schedules_updated_at ON public.schedules;',
      'DROP TRIGGER IF EXISTS handle_leaves_updated_at ON public.leaves;',
      'DROP TRIGGER IF EXISTS handle_tokens_updated_at ON public.google_calendar_tokens;',
      'DROP TRIGGER IF EXISTS notify_on_schedule_assignment ON public.schedules;',
      'DROP TRIGGER IF EXISTS audit_cases ON public.cases;',
      'DROP TRIGGER IF EXISTS audit_schedules ON public.schedules;',
      'DROP TRIGGER IF EXISTS audit_leaves ON public.leaves;',

      // Drop functions
      'DROP FUNCTION IF EXISTS public.handle_updated_at();',
      'DROP FUNCTION IF EXISTS public.notify_schedule_assignment();',
      'DROP FUNCTION IF EXISTS public.update_user_last_login();',
      'DROP FUNCTION IF EXISTS public.audit_user_action();',

      // Drop policies
      'DROP POLICY IF EXISTS "profiles_select" ON public.profiles;',
      'DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;',
      'DROP POLICY IF EXISTS "profiles_update" ON public.profiles;',
      'DROP POLICY IF EXISTS "cases_select" ON public.cases;',
      'DROP POLICY IF EXISTS "cases_insert" ON public.cases;',
      'DROP POLICY IF EXISTS "cases_update" ON public.cases;',
      'DROP POLICY IF EXISTS "schedules_select" ON public.schedules;',
      'DROP POLICY IF EXISTS "schedules_insert" ON public.schedules;',
      'DROP POLICY IF EXISTS "schedules_update" ON public.schedules;',
      'DROP POLICY IF EXISTS "schedules_delete" ON public.schedules;',
      'DROP POLICY IF EXISTS "leaves_select" ON public.leaves;',
      'DROP POLICY IF EXISTS "leaves_insert" ON public.leaves;',
      'DROP POLICY IF EXISTS "leaves_update" ON public.leaves;',
      'DROP POLICY IF EXISTS "sessions_select" ON public.user_sessions;',
      'DROP POLICY IF EXISTS "sessions_insert" ON public.user_sessions;',
      'DROP POLICY IF EXISTS "sessions_update" ON public.user_sessions;',
      'DROP POLICY IF EXISTS "tokens_select" ON public.google_calendar_tokens;',
      'DROP POLICY IF EXISTS "tokens_insert" ON public.google_calendar_tokens;',
      'DROP POLICY IF EXISTS "tokens_update" ON public.google_calendar_tokens;',
      'DROP POLICY IF EXISTS "tokens_delete" ON public.google_calendar_tokens;',
      'DROP POLICY IF EXISTS "notifications_select" ON public.notifications;',
      'DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;',
      'DROP POLICY IF EXISTS "notifications_update" ON public.notifications;',
      'DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;',
      'DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;',

      // Drop tables (in reverse dependency order)
      'DROP TABLE IF EXISTS public.audit_logs;',
      'DROP TABLE IF EXISTS public.google_calendar_tokens;',
      'DROP TABLE IF EXISTS public.notifications;',
      'DROP TABLE IF EXISTS public.user_sessions;',
      'DROP TABLE IF EXISTS public.leaves;',
      'DROP TABLE IF EXISTS public.schedules;',
      'DROP TABLE IF EXISTS public.cases;',
      'DROP TABLE IF EXISTS public.profiles;',
      'DROP TABLE IF EXISTS public.locations;',

      // Drop extension
      'DROP EXTENSION IF EXISTS "uuid-ossp";'
    ];

    for (const statement of dropStatements) {
      try {
        console.log(`Dropping: ${statement.split(' ')[1]} ${statement.split(' ')[2]}`);
        await supabase.rpc('exec_sql', { sql: statement });
      } catch (err) {
        console.log(`⚠️  Could not drop: ${err.message}`);
      }
    }

    console.log('\n✅ Cleanup completed\n');

    // Now recreate the schema
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded, recreating database...\n');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        await supabase.rpc('exec_sql', { sql: statement });
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
        // Continue with next statement - some might fail due to dependencies
      }
    }

    console.log('\n🎉 Schema recreation completed!');
    console.log('You can now run: npm run test-connection');

  } catch (error) {
    console.log('❌ Error recreating schema:', error.message);
  }
}

dropAndRecreateSchema();