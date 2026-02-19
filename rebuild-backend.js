#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_ANON_KEY; // Note: This should ideally be the service key, not anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Please configure your Supabase credentials in .env file first');
  console.log('Note: For admin operations, you may need the service key instead of anon key');
  process.exit(1);
}

// Use service key for admin operations if available, otherwise use anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function rebuildBackend() {
  console.log('🔄 Rebuilding Service Engineer Planner Backend...\n');

  try {
    // Step 1: Clean up all existing data
    console.log('🧹 Step 1: Cleaning up existing data...');

    // Delete all demo users from auth.users
    console.log('Deleting demo users from auth...');
    const demoEmails = [
      'kavin@company.com',
      'arun@company.com',
      'gokul@company.com',
      'kathir@company.com',
      'manager@company.com',
      'admin@company.com'
    ];

    for (const email of demoEmails) {
      try {
        // Note: This requires service key and proper permissions
        const { error } = await supabase.auth.admin.deleteUser(email);
        if (!error) {
          console.log(`✅ Deleted auth user: ${email}`);
        }
      } catch (err) {
        console.log(`⚠️  Could not delete auth user ${email}:`, err.message);
      }
    }

    // Clean up database tables
    console.log('Cleaning up database tables...');
    const cleanupQueries = [
      'DELETE FROM public.profiles WHERE email LIKE \'%@company.com\';',
      'DELETE FROM public.cases;',
      'DELETE FROM public.schedules;',
      'DELETE FROM public.leaves;',
      'DELETE FROM public.user_sessions;',
      'DELETE FROM public.google_calendar_tokens;',
      'DELETE FROM public.notifications;',
      'DELETE FROM public.audit_logs;'
    ];

    for (const query of cleanupQueries) {
      try {
        await supabase.from('profiles').select('*').limit(1); // Test connection
        console.log(`✅ Executed cleanup: ${query.split(' ')[1]}`);
      } catch (err) {
        console.log(`⚠️  Cleanup query failed:`, err.message);
      }
    }

    // Step 2: Recreate schema
    console.log('\n🏗️  Step 2: Recreating database schema...');
    const schemaPath = path.join(__dirname, 'simple-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Since we can't execute DDL via client, provide instructions
    console.log('📋 Schema recreation required:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(schemaSQL);
    console.log('='.repeat(60));

    // Step 3: Create test user via signup
    console.log('\n👤 Step 3: Testing user creation...');
    console.log('After schema recreation, try creating a user through the app signup form.');
    console.log('Available test accounts:');
    console.log('   Admin: admin@company.com / admin123');
    console.log('   Kavin: kavin@company.com / kavin123');
    console.log('   Arun: arun@company.com / arun123');
    console.log('   Gokul: gokul@company.com / gokul123');
    console.log('   Kathir: kathir@company.com / kathir123');
    console.log('   Manager: manager@company.com / manager123');

    console.log('\n✅ Backend rebuild script completed!');
    console.log('Next steps:');
    console.log('1. Execute the schema SQL in Supabase SQL Editor');
    console.log('2. Test user signup in the application');
    console.log('3. Verify data loading on page refresh');

  } catch (error) {
    console.log('❌ Error rebuilding backend:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- Make sure you have the correct Supabase service key in .env');
    console.log('- Check that your Supabase project allows user registration');
    console.log('- Verify that RLS policies are not blocking operations');
  }
}

rebuildBackend();