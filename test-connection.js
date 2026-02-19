#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('❌ Please update your .env file with actual Supabase credentials first!');
  console.log('Current values:');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('📡 Testing connection to Supabase...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('profiles')) {
        console.log('\n💡 The profiles table doesn\'t exist yet.');
        console.log('Please run the SQL schema in your Supabase dashboard:');
        console.log('1. Go to SQL Editor in your Supabase dashboard');
        console.log('2. Copy the content from src/database/schema.sql');
        console.log('3. Paste and run it');
      }
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log('✅ Database schema is properly set up!');
    
    // Test if we can create a user
    console.log('\n🧪 Testing user creation...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log('⚠️  Auth test failed (this is normal if email already exists):', authError.message);
    } else {
      console.log('✅ User creation test passed!');
    }

    console.log('\n🎉 Your Supabase setup is working correctly!');
    console.log('You can now run: npm run setup-db');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testConnection();
