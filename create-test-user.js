#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('❌ Please configure your Supabase credentials in .env file first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🧪 Creating a test user for immediate access...\n');

  const testUser = {
    email: 'test@company.com',
    password: 'test123',
    name: 'Test User',
    role: 'manager',
    location_id: 1
  };

  try {
    console.log(`Creating user: ${testUser.name} (${testUser.email})`);
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          name: testUser.name,
          role: testUser.role
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  User already exists, testing sign-in...`);
        
        // Test sign-in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password
        });

        if (signInError) {
          console.log(`❌ Sign-in failed: ${signInError.message}`);
        } else {
          console.log(`✅ Sign-in successful!`);
          console.log(`   You can now login with: ${testUser.email} / ${testUser.password}`);
        }
      } else {
        console.log(`❌ Error creating user: ${authError.message}`);
      }
      return;
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role,
          location_id: testUser.location_id,
          is_available: true,
          is_active: true
        });

      if (profileError) {
        console.log(`❌ Profile creation failed: ${profileError.message}`);
      } else {
        console.log(`✅ Test user created successfully!`);
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Password: ${testUser.password}`);
        console.log(`   Role: ${testUser.role}`);
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

createTestUser().catch(console.error);
