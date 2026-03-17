const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.error('❌ Error: Supabase credentials not found in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying Database Setup...');
  
  // Check tables
  const tables = ['locations', 'profiles', 'clients', 'cases', 'leaves'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.log(`❌ Table "${table}" is missing or inaccessible. Error: ${error.message}`);
      return false;
    }
    console.log(`✅ Table "${table}" found.`);
  }
  
  return true;
}

async function createInitialAdmin() {
  const adminEmail = 'admin@sep.com';
  const adminPassword = 'AdminPassword123!';

  console.log(`👑 Attempting to create admin user: ${adminEmail}`);

  const { data, error: authError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        name: 'System Admin',
        role: 'admin',
        is_admin: true
      }
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ Admin user already exists.');
    } else {
      console.error('❌ Auth error:', authError.message);
    }
    return;
  }

  // The profile should be created automatically by the trigger
  console.log('✅ Admin user created successfully.');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

async function main() {
  console.log('🚀 SEP Database Setup Helper');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const isReady = await verifySetup();
  
  if (isReady) {
    await createInitialAdmin();
    console.log('\n✨ Database setup verified and Admin account is ready.');
  } else {
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('1. Copy the contents of "src/database/schema.sql"');
    console.log('2. Paste it into the SQL Editor in your Supabase Dashboard');
    console.log('3. Run the SQL query to create the tables and triggers');
    console.log('4. Run this script again: node setup-full-db.js');
  }
}

main();
